import { ArrowUpRight } from "lucide-react";
import { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

const reduceMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ProductRow({ no, name, status, title, text, action, link }) {
  const cardRef = useRef(null);
  const mvX = useMotionValue(0.5);
  const mvY = useMotionValue(0.5);
  const springX = useSpring(mvX, { stiffness: 160, damping: 22, mass: 0.6 });
  const springY = useSpring(mvY, { stiffness: 160, damping: 22, mass: 0.6 });
  // Whole card tilts a few degrees toward the cursor, like a pane of glass catching light.
  const rotateX = useTransform(springY, [0, 1], [3.5, -3.5]);
  const rotateY = useTransform(springX, [0, 1], [-4.5, 4.5]);
  const glareX = useTransform(springX, (v) => `${v * 100}%`);
  const glareY = useTransform(springY, (v) => `${v * 100}%`);

  const handleMove = (event) => {
    if (reduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mvX.set((event.clientX - rect.left) / rect.width);
    mvY.set((event.clientY - rect.top) / rect.height);
  };
  const handleLeave = () => {
    mvX.set(0.5);
    mvY.set(0.5);
  };

  return (
    <motion.article
      className="productRow"
      ref={cardRef}
      style={reduceMotion ? undefined : { rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <span className="productNo">{no}</span>
      <div className="productName">
        <h3>{name}</h3>
        <small>{status}</small>
      </div>
      <div className="productInfo">
        <h4>{title}</h4>
        <p>{text}</p>
        <a href={link} target={link.startsWith("http") ? "_blank" : undefined} rel={link.startsWith("http") ? "noreferrer" : undefined}>
          {action} <ArrowUpRight size={12} strokeWidth={2.5} style={{ display: "inline", verticalAlign: "-1px" }} />
        </a>
      </div>
      {!reduceMotion && <motion.span className="productGlare" style={{ left: glareX, top: glareY }} />}
    </motion.article>
  );
}
