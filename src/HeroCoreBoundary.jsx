import { Component } from "react";

// If the 3D scene throws (WebGL unsupported, GPU/driver issue, a Three.js
// runtime error), this stops it from unmounting the entire app. Without an
// error boundary, React 18+ unmounts the whole tree on any uncaught render
// error — meaning a single WebGL hiccup would blank out the navbar, hero
// copy, and every section below it, not just the canvas.
export default class HeroCoreBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("3D hero core failed to render — falling back to static panel.", error, info);
  }

  render() {
    if (this.state.failed) return this.props.fallback ?? null;
    return this.props.children;
  }
}
