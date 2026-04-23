import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

import ghostImage from "../assets/confusedGhost.png";
import styles from "./sass/Lost.module.scss";

function Lost() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fps = 1;
  const frameDelay = Math.floor(60 / fps);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.imageSmoothingEnabled = false;

    const spriteWidth = 38;
    const spriteHeight = 39;
    const frameArray = [0, 1];

    const ghost = {
      imgW: spriteWidth,
      imgH: spriteHeight,
      img: new Image(),
      frameIndex: 0,
      frameArr: frameArray,
      draw: function () {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(
          this.img,
          this.imgW * this.frameArr[this.frameIndex],
          0,
          this.imgW,
          this.imgH,
          0,
          0,
          canvas.width,
          canvas.height,
        );
        this.frameIndex = (this.frameIndex + 1) % this.frameArr.length;
      },
    };

    ghost.img.src = ghostImage;
    let frameCounter = frameDelay;

    function renderCanvas() {
      frameCounter++;
      if (frameCounter < frameDelay) {
        requestAnimationFrame(renderCanvas);
        return;
      }
      frameCounter = 0;

      ghost.draw();
      requestAnimationFrame(renderCanvas);
    }

    ghost.img.onload = () => requestAnimationFrame(renderCanvas);

    return () => {
      context.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.message}>
        <h2>404</h2>
        <h1>Page Not Found</h1>
        <p>
          The page you're looking for isn't here. Please check the URL and try
          again.
        </p>

        <div className={styles.canvasContainer}>
          <canvas
            ref={canvasRef}
            id="GhostCanvas"
            width="266px"
            height="273px"
            className={styles.canvas}
          ></canvas>
        </div>
        <Link to="/">Return Home</Link>
      </div>
      {/* <script src="https://www.asadillahunty.com/scripts/animateGhost.js"></script> */}
    </div>
  );
}

export default Lost;
