export default function HeroSection() {
  return (
    <div className="relative bg-gray-900 text-white">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url(https://images.unsplash.com/photo-1441984904996-e0b6ba687e04)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.3
        }}
      />
      
      <div className="relative z-10 container mx-auto px-4 py-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Vinayak Garments
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            Discover our collection of premium clothing for every occasion
          </p>
          <button className="bg-primary text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-primary/90">
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}
