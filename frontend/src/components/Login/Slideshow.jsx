import React, { useState, useEffect } from 'react';

const Slideshow = ({ images, interval = 6000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);   //passe à l'image suivante, et si tu arrives à la fin, retourne à la première
    }, interval);

    return () => clearInterval(timer);
  }, [images, interval]);

  if (!images || images.length === 0) return null;

  return (
    <div className="absolute inset-0 w-full h-full z-0 pointer-events-none">
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'    //Si l'image a le même indice que currentIndex → on la montre (opacité 100%). Sinon, on cache (opacité 0%).
          }`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
    </div>
  );
};

export default Slideshow;
