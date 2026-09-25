import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import "./Hero.css";

function Hero() {
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["a developer", "a problem solver", "a builder", "a CS student", "a UVCEian"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="hero-section">
      <div className="hero-text-block">
        <div className="hero-text-inner">
          <h1 className="hero-headline">
            <span className="hero-greeting">Hi, I'm Goutham</span>
            <span className="hero-title-carousel">
              &nbsp;
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="hero-title-item"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -150 : 150,
                          opacity: 0,
                        }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>
          </h1>

          <p className="hero-subtext">
            Building full-stack projects and sharpening my DSA, always shipping something new.
          </p>
        </div>
      </div>
    </div>
  );
}

export { Hero };
