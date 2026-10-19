import React, { useState, useEffect, useRef } from "react";

type Review = {
  author_name: string;
  profile_photo_url: string;
  relative_time_description: string;
  rating: number;
  text: string;
  author_url?: string;
};

export default function GoogleReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5.0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cardsToShow, setCardsToShow] = useState(4);
  const scrollRef = useRef<HTMLDivElement>(null);

  const GOOGLE_PAGE_URL = "https://search.google.com/local/writereview?placeid=ChIJr-Xe6gXLWTkR_HMq1UxmLzE";

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 600) setCardsToShow(1.2); // 🔥 Shows 1 card + a peek of the next on mobile
      else if (window.innerWidth < 1024) setCardsToShow(2);
      else setCardsToShow(4);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const CACHE_KEY = "google_reviews_v3";
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 6 * 60 * 60 * 1000) {
        setReviews(data.reviews);
        setRating(data.rating);
        setTotal(data.total);
        setLoading(false);
        return;
      }
    }

    fetch("https://durablefastener.com/api/reviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.result?.reviews) {
          const filtered = data.result.reviews.filter((rev: any) => rev.rating >= 4);
          setReviews(filtered);
          setRating(data.result.rating || 5.0);
          setTotal(data.result.total || 0);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ 
            data: { reviews: filtered, rating: data.result.rating, total: data.result.total }, 
            timestamp: Date.now() 
          }));
        }
        setLoading(false);
      })
      .catch(() => { setError(true); setLoading(false); });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const totalSlides = Math.max(0, reviews.length - Math.floor(cardsToShow) + 1);

  const scrollToSlide = (index: number) => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.offsetWidth / cardsToShow;
      setCurrentSlide(index);
      scrollRef.current.scrollTo({ left: index * (cardWidth + 20), behavior: "smooth" });
    }
  };

  const scroll = (dir: "left" | "right") => {
    let next = dir === "left" ? currentSlide - 1 : currentSlide + 1;
    if (next >= 0 && next < totalSlides) scrollToSlide(next);
  };

  if (loading) return null;

  return (
    <section style={{ padding: "40px 0", backgroundColor: "#fff" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 20px", position: "relative" }}>
        
        {/* HEADER BAR - Fixed for Mobile Wrap */}
        <div style={headerWrapperStyle}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: "32px", fontWeight: "bold", color: "#000" }}>Excellent</h2>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px", marginTop: "5px" }}>
              <span style={{ color: "#FBBC05", fontSize: "18px" }}>{"★".repeat(5)}</span>
              <span style={{ fontSize: "14px", color: "#666" }}>Based on <b>{total} reviews</b></span>
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" 
                alt="Google" 
                style={{ height: "20px", objectFit: "contain" }} 
              />
            </div>
          </div>
          
          <div style={buttonContainerStyle}>
            <a href={GOOGLE_PAGE_URL} target="_blank" rel="noreferrer" style={buttonStyle}>
              Review us on Google
            </a>
          </div>
        </div>

        {/* SLIDER WRAPPER */}
        <div style={{ position: "relative" }}>
          {/* Hide arrows on small mobile to prevent overlap */}
          <button onClick={() => scroll("left")} style={{ ...arrowStyle, left: "-15px", display: window.innerWidth < 600 ? 'none' : 'flex' }}>‹</button>
          <button onClick={() => scroll("right")} style={{ ...arrowStyle, right: "-15px", display: window.innerWidth < 600 ? 'none' : 'flex' }}>›</button>

          {/* Cards Container */}
          <div 
            ref={scrollRef} 
            style={{ 
              display: "flex", 
              gap: "20px", 
              overflowX: window.innerWidth < 600 ? "auto" : "hidden", // Allow touch scroll on mobile
              scrollBehavior: "smooth", 
              padding: "20px 5px",
              scrollbarWidth: 'none'
            }}
          >
            {reviews.map((rev, i) => (
              <div key={i} style={{
                ...cardStyle,
                minWidth: `calc((100% - ${(Math.ceil(cardsToShow) - 1) * 20}px) / ${cardsToShow})`,
                maxWidth: `calc((100% - ${(Math.ceil(cardsToShow) - 1) * 20}px) / ${cardsToShow})`,
              }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "12px" }}>
                  <img src={rev.profile_photo_url} alt="" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "14px", color: "#000" }}>{rev.author_name}</div>
                    <div style={{ fontSize: "11px", color: "#777" }}>{rev.relative_time_description}</div>
                  </div>
                </div>
                <div style={{ color: "#FBBC05", fontSize: "13px", marginBottom: "8px" }}>{"★".repeat(rev.rating)}</div>
                <p style={reviewTextStyle}>{rev.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* DOTS */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          {Array.from({ length: Math.min(totalSlides, 8) }).map((_, i) => (
            <div key={i} onClick={() => scrollToSlide(i)} style={{
              display: "inline-block", width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: i === currentSlide ? "#000" : "#ccc", margin: "0 4px", cursor: "pointer"
            }} />
          ))}
        </div>
      </div>
    </section>
  );
}

// --- Responsive Styles ---

const headerWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "30px",
  flexWrap: "wrap",
  gap: "20px"
};

const buttonContainerStyle: React.CSSProperties = {
  minWidth: "160px",
  display: "flex",
  justifyContent: "flex-end"
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  border: "1px solid #ccc",
  borderRadius: "8px",
  textDecoration: "none",
  color: "#000",
  fontSize: "14px",
  fontWeight: "600",
  textAlign: "center",
  boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
  backgroundColor: "#fff"
};

const cardStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: "15px",
  padding: "20px",
  border: "1px solid #eee",
  boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
  display: "flex",
  flexDirection: "column",
  boxSizing: "border-box",
  height: "220px",
  flexShrink: 0
};

const reviewTextStyle: React.CSSProperties = {
  fontSize: "13px",
  lineHeight: "1.6",
  color: "#444",
  fontStyle: "italic",
  margin: 0,
  display: "-webkit-box",
  WebkitLineClamp: 4,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const arrowStyle: React.CSSProperties = {
  position: "absolute",
  top: "55%",
  transform: "translateY(-50%)",
  width: "40px",
  height: "40px",
  borderRadius: "50%",
  backgroundColor: "#fff",
  border: "1px solid #eee",
  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
  zIndex: 10,
  cursor: "pointer",
  fontSize: "20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#000"
};
