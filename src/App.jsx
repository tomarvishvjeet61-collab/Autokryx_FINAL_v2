import { lazy, Suspense, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, ArrowUpRight, ArrowDownRight } from "lucide-react";
import ProductRow from "./ProductRow.jsx";
import HeroCoreBoundary from "./HeroCoreBoundary.jsx";
import "./App.css";

gsap.registerPlugin(ScrollTrigger);

// Code-split the 3D scene (three.js + fiber) into its own chunk so the
// initial page paint isn't blocked by it.
const HeroCore = lazy(() => import("./HeroCore.jsx"));

const products = [
  ["01", "INSIDE", "ACTIVE", "Private Campus Social Infrastructure", "India's first verified private social network for college students. INSIDE gives campus students a space that is entirely their own — verified identities, institution-scoped communities, and zero noise from the outside world.", "Visit INSIDE", "https://getinside.in/"],
  ["02", "KRYX", "IN DEVELOPMENT", "Decentralised Identity & Trust Protocol", "A permissioned blockchain infrastructure layer enabling verified digital identity, immutable credential attestation, and trustless data exchange — powering institutional-grade trust across Autokryx's product ecosystem and partner networks.", "Partner Enquiry", "#contact"],
  ["03", "NEXUS", "PLANNED", "Verified Community Networks", "Community infrastructure for verified professional and social networks — beyond campus, beyond a single vertical. NEXUS will bring Autokryx's identity-first approach to every structured community in India.", "Expression of Interest", "#contact"],
  ["04", "VAULT", "ROADMAP", "Embedded Financial Infrastructure", "Financial services embedded natively within the Autokryx product ecosystem — payments, savings, and credit designed specifically for the verified communities our platforms serve.", "Investor Enquiry", "#contact"],
  ["05", "REDAKX AI", "ECOSYSTEM", "AI & Intelligence", "Redakx AI is part of the Autokryx technology ecosystem.", "Explore ecosystem", "#contact"],
];

const technology = [
  ["I", "Identity-Native Architecture", "Every user in every Autokryx product is a verified real person. Identity is the foundation everything else is built upon."],
  ["II", "Network Effect Engine", "Our platforms grow stronger with every new user. The architecture incentivises organic growth and community compounding at every layer."],
  ["III", "Privacy-First Infrastructure", "Community-scoped data architecture. Information shared within a community stays within that community. Trust is a technical constraint."],
  ["IV", "India-Scale Engineering", "Designed from day one to work for 500 million users. We engineer scale in from the beginning, at every layer of the stack."],
];

const milestones = [
  ["I", "Delhi NCR", "Product-Market Fit", "Controlled launch of INSIDE across select NCR institutions. Proving the model, refining the platform, building the playbook.", "ACTIVE · 2026"],
  ["II", "North India", "Network Expansion", "Scaling the proven playbook across UP, Haryana, Rajasthan, and Punjab. First 100+ institutions. First 1M verified users.", "2026–27"],
  ["III", "National", "Platform Dominance", "Full national rollout. INSIDE becomes the default social infrastructure of Indian campus life. KRYX and NEXUS enter beta.", "2027"],
];

function App() {
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pointer, setPointer] = useState({ x: 50, y: 50 });
  const [activeSection, setActiveSection] = useState("");
  // Normalized (0..1) refs for the 3D scene — read every animation frame
  // without triggering React re-renders on every mouse move / scroll tick.
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const scrollRef = useRef(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const updateScrollProgress = () => {
      if (!heroRef.current) return;
      const { bottom } = heroRef.current.getBoundingClientRect();
      // 0 while the hero fills the viewport, moving to 1 as it scrolls out of view.
      scrollRef.current = Math.min(1, Math.max(0, 1 - bottom / window.innerHeight));
    };

    // Smooth inertia scrolling — skipped for users who've asked for reduced motion.
    const lenis = reduceMotion ? null : new Lenis({ duration: 1.1, smoothWheel: true });
    let rafId;
    if (lenis) {
      lenis.on("scroll", ({ scroll }) => {
        setScrolled(scroll > 30);
        updateScrollProgress();
        ScrollTrigger.update();
      });
      const raf = (time) => {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    }

    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      updateScrollProgress();
    };
    const onPointer = (event) => {
      const nx = event.clientX / window.innerWidth;
      const ny = event.clientY / window.innerHeight;
      setPointer({ x: nx * 100, y: ny * 100 });
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
    };
    const onTouch = (event) => {
      const t = event.touches[0];
      if (!t) return;
      const nx = t.clientX / window.innerWidth;
      const ny = t.clientY / window.innerHeight;
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
    };
    // Mobile parity: no mouse, so tilt the core using the device gyroscope instead.
    const onOrientation = (event) => {
      if (event.gamma == null || event.beta == null) return;
      const nx = 0.5 + Math.max(-1, Math.min(1, event.gamma / 45)) * 0.5;
      const ny = 0.5 + Math.max(-1, Math.min(1, (event.beta - 45) / 45)) * 0.5;
      pointerRef.current.x = nx;
      pointerRef.current.y = ny;
    };
    const timer = window.setTimeout(() => setLoading(false), 650);
    updateScrollProgress();
    // Native scroll listener stays too: it drives updateScrollProgress when
    // Lenis is off (reduced motion) and as a fallback if Lenis is still settling.
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });
    window.addEventListener("deviceorientation", onOrientation);
    window.addEventListener("resize", updateScrollProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("touchmove", onTouch);
      window.removeEventListener("deviceorientation", onOrientation);
      window.removeEventListener("resize", updateScrollProgress);
      window.clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };
  }, []);

  // GSAP ScrollTrigger: the brief's "smooth section transitions" — the nav
  // link for whichever section is centred in view fades to gold. Deliberately
  // kept off the 3D canvas/DOM content itself, so it never competes with the
  // R3F render loop driving the hero core.
  useEffect(() => {
    const sections = ["company", "products", "technology", "corporate"];
    const triggers = sections
      .filter((id) => document.getElementById(id))
      .map((id) =>
        ScrollTrigger.create({
          trigger: `#${id}`,
          start: "top 55%",
          end: "bottom 55%",
          onEnter: () => setActiveSection(id),
          onEnterBack: () => setActiveSection(id),
        })
      );
    return () => triggers.forEach((trigger) => trigger.kill());
  }, []);

  return (
    <>
      {loading && <div className="preloader"><span>AUTO<span>KRYX</span></span><i /></div>}
    <div className="site">
      <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <a className="logo" href="#top">AUTO<span>KRYX</span></a>
        <nav>
          <a href="#company" className={activeSection === "company" ? "active" : undefined}>Company</a>
          <a href="#products" className={activeSection === "products" ? "active" : undefined}>Products</a>
          <a href="#technology" className={activeSection === "technology" ? "active" : undefined}>Technology</a>
          <a href="#corporate" className={activeSection === "corporate" ? "active" : undefined}>Corporate</a>
        </nav>
        <a className="navContact" href="#contact">Get in touch <span><ArrowUpRight size={13} strokeWidth={2.5} /></span></a>
      </header>

      <main id="top">
        <section className="hero" ref={heroRef}>
          <div className="heroIndex">01 / AUTOKRYX TECHNOLOGIES</div>
          <div className="heroRule" />
          <div className="heroGrid">
            <div className="heroCopy">
              <p className="kicker">INFRASTRUCTURE · IDENTITY · INTELLIGENCE</p>
              <h1>Technology<br /><em>built for</em><br /><strong>one billion.</strong></h1>
              <p className="heroText">We build the consumer technology infrastructure that will define how India connects, communicates and transacts.</p>
              <div className="heroButtons">
                <a className="button dark" href="#products">Explore products <span><ArrowDownRight size={14} strokeWidth={2.5} /></span></a>
                <a className="textLink" href="#company">Discover Autokryx <span><ArrowRight size={13} strokeWidth={2.5} /></span></a>
              </div>
            </div>
            <div className="heroPanel">
              <div className="panelTop"><span>DELHI NCR</span><span>2026</span></div>
              <div className="panelCore" style={{ "--px": `${pointer.x}%`, "--py": `${pointer.y}%` }}>
                <HeroCoreBoundary
                  fallback={
                    <>
                      <span className="coreLine" />
                      <span className="coreDot" />
                      <span className="coreLine second" />
                    </>
                  }
                >
                  <Suspense fallback={null}>
                    <HeroCore pointerRef={pointerRef} scrollRef={scrollRef} />
                  </Suspense>
                </HeroCoreBoundary>
                <span className="coreGlow" />
              </div>
              <div className="panelBottom"><span>CONSUMER TECHNOLOGY</span><span>INDIA</span></div>
            </div>
          </div>
          <div className="heroTicker"><span>SCALABLE SYSTEMS</span><span>VERIFIED IDENTITY</span><span>LONG-TERM INFRASTRUCTURE</span><span>01 — 04</span></div>
        </section>

        <section id="company" className="section company">
          <div className="sectionLabel"><span>02</span><span>THE COMPANY</span></div>
          <div className="splitHeading">
            <h2>We build the<br /><em>platforms India<br />runs on.</em></h2>
            <div><p>Autokryx Technologies is a consumer technology company headquartered in Delhi NCR. We identify where digital infrastructure is missing and build platforms that fill those gaps — at scale, with precision, and built for the long term.</p><a className="textLink" href="#corporate">Our corporate profile <span><ArrowRight size={13} strokeWidth={2.5} /></span></a></div>
          </div>
          <div className="principles">
            <article><span>01</span><h3>Consumer<br />Technology</h3><p>We build products that end users interact with daily. Our products are designed for real behaviour — built on deep understanding of how India's digital consumers think and move.</p></article>
            <article><span>02</span><h3>Scalable<br />Infrastructure</h3><p>Every platform is engineered to grow from 1,000 to 100 million users without architectural overhaul. We think in systems, not features.</p></article>
            <article><span>03</span><h3>Verified<br />Identity</h3><p>Across every product vertical, we embed real identity at the foundation. Verified communities create trust. Trust creates engagement.</p></article>
          </div>
        </section>

        <section id="products" className="section products">
          <div className="sectionLabel light"><span>03</span><span>PRODUCT VERTICALS</span></div>
          <div className="productsIntro"><h2>Four platforms.<br /><em>One ecosystem.</em></h2><p>Identity-first technology built around India's structured communities.</p></div>
          <div className="productList">
            {products.map(([no, name, status, title, text, action, link]) => (
              <ProductRow key={name} no={no} name={name} status={status} title={title} text={text} action={action} link={link} />
            ))}
          </div>
        </section>

        <section className="partners"><div className="sectionLabel light"><span>04A</span><span>ECOSYSTEM</span></div><div className="partnerIntro"><h2>Built with<br /><em>the best.</em></h2><p>Technology partnerships and ecosystem relationships that extend Autokryx beyond a single product.</p></div><div className="partnerGrid"><span>SARVAM AI</span><span>AWS</span><span>NVIDIA</span><span>MICROSOFT</span><span>DEEPGRAM</span></div></section>

        <section id="technology" className="section tech">
          <div className="sectionLabel"><span>04</span><span>TECHNOLOGY</span></div>
          <div className="techHeader"><h2>Built different.<br /><em>By design.</em></h2><p>Every platform in the Autokryx ecosystem is built on a shared technological foundation — designed for trust, scale, and compounding network effects.</p></div>
          <div className="techRows">
            {technology.map(([no, title, text]) => <article key={no}><span>{no}</span><div><h3>{title}</h3><p>{text}</p></div><b>+</b></article>)}
          </div>
        </section>

        <section className="numbers">
          <div className="numbersTitle"><span>05 — OPPORTUNITY</span><h2>Serving India's<br /><em>next billion.</em></h2></div>
          <div className="number"><strong>900M+</strong><span>Internet Users</span><small>In India By 2030</small></div>
          <div className="number"><strong>40M</strong><span>College Students</span><small>Underserved Today</small></div>
          <div className="number"><strong>$150B</strong><span>India Consumer Tech</span><small>Market Size · 2025</small></div>
        </section>

        <section className="section roadmap">
          <div className="sectionLabel"><span>06</span><span>VISION</span></div>
          <div className="roadmapHeader"><h2>A systematic<br /><em>national build-out.</em></h2><p>From controlled launches to national infrastructure, the roadmap compounds one proven network at a time.</p></div>
          <div className="milestones">
            {milestones.map(([no, region, title, text, date]) => <article key={no}><div className="milestoneTop"><span>{no}</span><small>{date}</small></div><p>{region}</p><h3>{title}</h3><div className="milestoneLine" /><span className="milestoneText">{text}</span></article>)}
          </div>
        </section>

        <section id="corporate" className="section corporate">
          <div className="sectionLabel"><span>07</span><span>CORPORATE</span></div>
          <div className="corporateGrid"><h2>Incorporated.<br /><em>Compliant.<br />Built to endure.</em></h2><div><p className="quote">“We are building consumer technology infrastructure that will outlast trends and define how India interacts with the digital world.”</p><p>Autokryx Technologies Private Limited is a purpose-built corporate entity. From day one, we have operated with full regulatory compliance, structured governance, and a long-term mandate.</p></div></div>
          <div className="legal"><div><span>LEGAL STRUCTURE</span><b>Private Limited Company</b></div><div><span>GOVERNING LAW</span><b>Companies Act, 2013 — India</b></div><div><span>CIN</span><b>U62012UW2026PTC250543</b></div><div><span>REGULATOR</span><b>Ministry of Corporate Affairs · Government of India</b></div><div><span>INDUSTRY CODE</span><b>NIC 62012 · Information Technology</b></div><div><span>INCORPORATED</span><b>2026</b></div></div>
        </section>

        <section id="contact" className="contact">
          <div className="contactMark">AK</div>
          <p className="kicker">08 — CONTACT · DELHI NCR · INDIA</p>
          <h2>Let's build<br /><em>the future.</em></h2>
          <a className="button lightButton" href="https://autokryx.in/" target="_blank" rel="noreferrer">Visit Autokryx <ArrowUpRight size={14} strokeWidth={2.5} /></a>
        </section>
      </main>

      <footer>
        <div><a className="logo" href="#top">AUTO<span>KRYX</span></a><p>Building India's consumer technology infrastructure.</p></div>
        <div className="footerLinks"><a href="#company">Company</a><a href="#products">Products</a><a href="#technology">Technology</a><a href="#corporate">Corporate</a><a href="#contact">Contact</a></div>
        <div className="footerLegal"><span>© 2026 Autokryx Technologies Private Limited.</span><span>CIN: U62012UW2026PTC250543</span></div>
      </footer>
    </div>
    </>
  );
}

export default App;
