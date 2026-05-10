const BackgroundElements = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-[10%] -translate-y-1/2 text-[40rem] font-serif text-[#dcd7cd]/40 z-0 select-none pointer-events-none"
      >
        道
      </div>
      <div
        aria-hidden="true"
        className="absolute top-1/2 right-[25%] -translate-y-1/2 w-140 h-140 bg-brand-cream-dark/50 rounded-full z-1"
      ></div>
    </>
  );
};

export default BackgroundElements;
