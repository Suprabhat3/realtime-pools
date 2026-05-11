import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import BackgroundElements from "../components/BackgroundElements";
import Header from "../components/Header";
import { useAuth } from "../auth/AuthProvider";
import { getImageKitSignature, getMyProfile, updateMyProfile, type UserProfile } from "../lib/user-api";

type ProfileFormState = {
  name: string;
  gender: UserProfile["gender"];
  bio: string;
  location: string;
  birthday: string;
  phone: string;
  timezone: string;
  pronouns: string;
  image: string;
  imageFileId: string;
};

type LoadedImage = {
  element: HTMLImageElement;
  width: number;
  height: number;
};

const CROP_SIZE = 280;
const OUTPUT_SIZE = 512;

const genderOptions: Array<{ label: string; value: UserProfile["gender"] }> = [
  { label: "Male", value: "MALE" },
  { label: "Female", value: "FEMALE" },
  { label: "Non-binary", value: "NON_BINARY" },
  { label: "Prefer not to say", value: "PREFER_NOT_TO_SAY" }
];

const emptyForm = (profile: UserProfile | null): ProfileFormState => ({
  name: profile?.name ?? "",
  gender: profile?.gender ?? null,
  bio: profile?.bio ?? "",
  location: profile?.location ?? "",
  birthday: profile?.birthday ?? "",
  phone: profile?.phone ?? "",
  timezone: profile?.timezone ?? "",
  pronouns: profile?.pronouns ?? "",
  image: profile?.image ?? "",
  imageFileId: profile?.imageFileId ?? ""
});

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

const getRenderedSize = (naturalWidth: number, naturalHeight: number, zoom: number) => {
  const coverScale = Math.max(CROP_SIZE / naturalWidth, CROP_SIZE / naturalHeight);
  return {
    width: naturalWidth * coverScale * zoom,
    height: naturalHeight * coverScale * zoom
  };
};

const clampOffsets = (x: number, y: number, renderedWidth: number, renderedHeight: number) => {
  const maxX = (renderedWidth - CROP_SIZE) / 2;
  const maxY = (renderedHeight - CROP_SIZE) / 2;

  return {
    x: clamp(x, -maxX, maxX),
    y: clamp(y, -maxY, maxY)
  };
};

const loadImage = async (src: string): Promise<LoadedImage> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        element: image,
        width: image.naturalWidth,
        height: image.naturalHeight
      });
    };
    image.onerror = () => reject(new Error("Unable to load selected image"));
    image.src = src;
  });
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState<ProfileFormState>(() => emptyForm(null));
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
  const [pendingImageName, setPendingImageName] = useState<string>("avatar.jpg");
  const [loadedImage, setLoadedImage] = useState<LoadedImage | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropX, setCropX] = useState(0);
  const [cropY, setCropY] = useState(0);

  const dragRef = useRef<{ active: boolean; startX: number; startY: number; startCropX: number; startCropY: number }>({
    active: false,
    startX: 0,
    startY: 0,
    startCropX: 0,
    startCropY: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/signin", { replace: true });
      return;
    }

    if (isAuthenticated) {
      void (async () => {
        try {
          const data = await getMyProfile();
          setProfile(data);
          setForm(emptyForm(data));
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unable to load profile";
          setErrorMessage(message);
        }
      })();
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (!pendingImageUrl) {
      setLoadedImage(null);
      return;
    }

    void (async () => {
      try {
        const image = await loadImage(pendingImageUrl);
        setLoadedImage(image);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to prepare cropper";
        setErrorMessage(message);
        setPendingImageUrl(null);
      }
    })();
  }, [pendingImageUrl]);

  useEffect(() => {
    return () => {
      if (pendingImageUrl) {
        URL.revokeObjectURL(pendingImageUrl);
      }
    };
  }, [pendingImageUrl]);

  const handleChange = (key: keyof ProfileFormState, value: string) => {
    setForm((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const closeCropper = () => {
    if (pendingImageUrl) {
      URL.revokeObjectURL(pendingImageUrl);
    }

    setPendingImageUrl(null);
    setLoadedImage(null);
    setCropZoom(1);
    setCropX(0);
    setCropY(0);
  };

  const uploadBlob = async (blob: Blob, fileName: string) => {
    const signature = await getImageKitSignature();
    const formData = new FormData();
    formData.append("file", blob, fileName);
    formData.append("fileName", fileName);
    formData.append("publicKey", signature.publicKey);
    formData.append("signature", signature.signature);
    formData.append("token", signature.token);
    formData.append("expire", signature.expire.toString());
    formData.append("folder", signature.folder);
    formData.append("useUniqueFileName", "true");

    const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      const message = body?.message ?? "Image upload failed";
      throw new Error(message);
    }

    const body = (await response.json()) as { url: string; fileId: string };
    setForm((prev) => ({
      ...prev,
      image: body.url,
      imageFileId: body.fileId
    }));
  };

  const handleApplyCrop = async () => {
    if (!loadedImage) return;

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { width: renderedWidth, height: renderedHeight } = getRenderedSize(
        loadedImage.width,
        loadedImage.height,
        cropZoom
      );

      const clamped = clampOffsets(cropX, cropY, renderedWidth, renderedHeight);
      const topLeftX = CROP_SIZE / 2 - renderedWidth / 2 + clamped.x;
      const topLeftY = CROP_SIZE / 2 - renderedHeight / 2 + clamped.y;

      const sx = (0 - topLeftX) * (loadedImage.width / renderedWidth);
      const sy = (0 - topLeftY) * (loadedImage.height / renderedHeight);
      const sWidth = CROP_SIZE * (loadedImage.width / renderedWidth);
      const sHeight = CROP_SIZE * (loadedImage.height / renderedHeight);

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Your browser does not support image editing");
      }

      context.drawImage(loadedImage.element, sx, sy, sWidth, sHeight, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => {
            if (!result) {
              reject(new Error("Could not prepare image for upload"));
              return;
            }

            resolve(result);
          },
          "image/jpeg",
          0.92
        );
      });

      const sanitizedName = pendingImageName.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "-");
      const fileName = `${sanitizedName || "avatar"}.jpg`;

      await uploadBlob(blob, fileName);
      closeCropper();
      setSuccessMessage("Profile image updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload image";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: Partial<UserProfile> = {
        name: form.name.trim() || null,
        gender: form.gender ?? null,
        bio: form.bio.trim() || null,
        location: form.location.trim() || null,
        birthday: form.birthday || null,
        phone: form.phone.trim() || null,
        timezone: form.timezone.trim() || null,
        pronouns: form.pronouns.trim() || null,
        image: form.image || null,
        imageFileId: form.imageFileId || null
      };

      const updated = await updateMyProfile(payload);
      setProfile(updated);
      setForm(emptyForm(updated));
      setSuccessMessage("Profile updated");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update profile";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const avatarText = useMemo(() => {
    if (form.name) return form.name.charAt(0).toUpperCase();
    if (profile?.email) return profile.email.charAt(0).toUpperCase();
    return "?";
  }, [form.name, profile?.email]);

  const renderedSize = useMemo(() => {
    if (!loadedImage) {
      return { width: CROP_SIZE, height: CROP_SIZE };
    }

    return getRenderedSize(loadedImage.width, loadedImage.height, cropZoom);
  }, [loadedImage, cropZoom]);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      <BackgroundElements />
      <Header />
      <main className="relative z-10 flex grow items-start justify-center px-4 py-10">
        <section className="w-full max-w-4xl border border-gray-200 bg-white/85 backdrop-blur-sm p-8 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-crimson">Profile</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900">Your profile</h1>
          <p className="mt-2 text-sm text-gray-600">Manage your personal information and avatar.</p>

          <form className="mt-8 grid gap-8 lg:grid-cols-[240px,1fr]" onSubmit={onSubmit}>
            <div className="flex flex-col items-center gap-4">
              <div className="h-36 w-36 rounded-full border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                {form.image ? (
                  <img src={form.image} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-gray-500">{avatarText}</span>
                )}
              </div>
              <label className="w-full">
                <span className="sr-only">Upload profile image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;

                    if (pendingImageUrl) {
                      URL.revokeObjectURL(pendingImageUrl);
                    }

                    setErrorMessage(null);
                    setSuccessMessage(null);
                    setPendingImageName(file.name);
                    setCropZoom(1);
                    setCropX(0);
                    setCropY(0);
                    setPendingImageUrl(URL.createObjectURL(file));
                    event.currentTarget.value = "";
                  }}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-none file:border-0 file:bg-brand-crimson file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-crimson-hover"
                />
              </label>
              <p className="text-xs text-gray-500 text-center">Choose, crop, then upload. JPEG/PNG supported.</p>
              {isUploading ? <p className="text-xs text-gray-500">Uploading...</p> : null}
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Full name</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) => handleChange("name", event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Gender</span>
                  <select
                    value={form.gender ?? ""}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        gender: event.target.value ? (event.target.value as UserProfile["gender"]) : null
                      }))
                    }
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                  >
                    <option value="">Select</option>
                    {genderOptions.map((option) => (
                      <option key={option.value ?? ""} value={option.value ?? ""}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Bio</span>
                <textarea
                  value={form.bio}
                  onChange={(event) => handleChange("bio", event.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                  placeholder="Tell us a bit about yourself"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Location</span>
                  <input
                    type="text"
                    value={form.location}
                    onChange={(event) => handleChange("location", event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="City, Country"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Birthday</span>
                  <input
                    type="date"
                    value={form.birthday}
                    onChange={(event) => handleChange("birthday", event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Phone</span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => handleChange("phone", event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="+14155552671"
                  />
                  <p className="mt-1 text-xs text-gray-500">Use E.164 format with a leading +.</p>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-gray-700">Timezone</span>
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(event) => handleChange("timezone", event.target.value)}
                    className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                    placeholder="Asia/Kolkata"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-gray-700">Pronouns</span>
                <input
                  type="text"
                  value={form.pronouns}
                  onChange={(event) => handleChange("pronouns", event.target.value)}
                  className="w-full border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-brand-crimson"
                  placeholder="she/her"
                />
              </label>

              {errorMessage ? <p className="text-sm text-red-700">{errorMessage}</p> : null}
              {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

              <div className="flex items-center justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="bg-brand-crimson px-6 py-3 text-sm font-bold text-white transition hover:bg-brand-crimson-hover disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </form>
        </section>
      </main>

      {pendingImageUrl ? (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md border border-gray-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Adjust profile image</h2>
            <p className="mt-1 text-sm text-gray-600">Drag to reposition and zoom to frame your face.</p>

            <div
              className="relative mt-4 h-[280px] w-[280px] overflow-hidden rounded-full border border-gray-300 bg-gray-100 mx-auto cursor-move"
              onMouseDown={(event) => {
                dragRef.current = {
                  active: true,
                  startX: event.clientX,
                  startY: event.clientY,
                  startCropX: cropX,
                  startCropY: cropY
                };
              }}
              onMouseMove={(event) => {
                if (!dragRef.current.active || !loadedImage) return;

                const nextX = dragRef.current.startCropX + (event.clientX - dragRef.current.startX);
                const nextY = dragRef.current.startCropY + (event.clientY - dragRef.current.startY);
                const clamped = clampOffsets(nextX, nextY, renderedSize.width, renderedSize.height);
                setCropX(clamped.x);
                setCropY(clamped.y);
              }}
              onMouseUp={() => {
                dragRef.current.active = false;
              }}
              onMouseLeave={() => {
                dragRef.current.active = false;
              }}
            >
              {loadedImage ? (
                <img
                  src={pendingImageUrl}
                  alt="Crop preview"
                  draggable={false}
                  className="absolute left-1/2 top-1/2 select-none"
                  style={{
                    width: `${renderedSize.width}px`,
                    height: `${renderedSize.height}px`,
                    transform: `translate(calc(-50% + ${cropX}px), calc(-50% + ${cropY}px))`
                  }}
                />
              ) : null}
              <div className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-white/70" />
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-gray-700">Zoom</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={cropZoom}
                onChange={(event) => {
                  if (!loadedImage) return;
                  const zoom = Number(event.target.value);
                  const nextSize = getRenderedSize(loadedImage.width, loadedImage.height, zoom);
                  const clamped = clampOffsets(cropX, cropY, nextSize.width, nextSize.height);
                  setCropZoom(zoom);
                  setCropX(clamped.x);
                  setCropY(clamped.y);
                }}
                className="w-full"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                onClick={closeCropper}
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-brand-crimson px-4 py-2 text-sm font-semibold text-white hover:bg-brand-crimson-hover disabled:opacity-70"
                onClick={() => {
                  void handleApplyCrop();
                }}
                disabled={isUploading || !loadedImage}
              >
                {isUploading ? "Uploading..." : "Use this image"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ProfilePage;
