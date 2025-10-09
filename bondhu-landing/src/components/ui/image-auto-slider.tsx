import React from 'react';

export const Component = () => {
  // Images for the infinite scroll - using Unsplash URLs
  const images = [
  // Unsplash - Close-up logo/abstract
  "https://www.quirks.com/storage/attachments/683e0a62a772792759527a39/683e0cef121b43734b413490/original/Gen-Z-mental-health-crisis-is-real-what-research-tells-us-about-brand-responsibility.jpg",
  
  // Unsplash - Person behind fog glass (depression/isolation theme)
  "https://cdn.i.haymarketmedia.asia/?n=campaign-asia%2Fcontent%2F_corona_panic_headlines_shutterstock_1672871452.jpg&h=630&w=1200&q=75&v=20250320&c=1",
  
  // Mental health statistics infographic
  "https://alldaymedicalcare.com/wp-content/uploads/2024/08/mental-health-2-1.jpg",
  
  // Indian Express - Loneliness article image
  "https://resize.indiatvnews.com/en/resize/newbucket/1200_-/2025/01/befunky-collage-2025-01-27t164238-1737976307.webp",
  
  // Media India - Loneliness theme
  "https://www.yourcounselling.ca/wp-content/uploads/2020/08/sept-10-thegem-blog-default.jpeg",
  
  // Mental health statistics chart (India)
  "https://www.iasgyan.in//ig-uploads/images//MH2.png",
  
  // Mental health infographic (Pinterest)
  "https://i.pinimg.com/736x/2f/d3/6d/2fd36d2ded20509f983c0231f801c804.jpg",
  
  // Feeling lonely and alone illustration
  "https://robkish.life/wp-content/uploads/2018/03/feeling-lonely-and-alone.jpg"
];





  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images];

  return (
    <>
      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .infinite-scroll {
          animation: scroll-right 20s linear infinite;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>
      
      <div className="w-full relative overflow-hidden flex items-center justify-center">
        {/* Scrolling images container */}
        <div className="relative z-10 w-full flex items-center justify-center py-8">
          <div className="scroll-container w-full">
            <div className="infinite-scroll flex gap-6 w-max">
              {duplicatedImages.map((image, index) => (
                <div
                  key={index}
                  className="image-item flex-shrink-0 w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-xl overflow-hidden shadow-2xl"
                >
                  <img
                    src={image}
                    alt={`Gallery image ${(index % images.length) + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
