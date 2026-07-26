import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";

import ghostImage from "../assets/confusedGhost.png";
import styles from "./sass/Lost.module.scss";

const FRAMES_PER_SECOND = 1;
const FRAME_DELAY = Math.floor(60 / FRAMES_PER_SECOND);

function Lost() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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

    let animationFrameId: number | undefined;
    let frameCounter = FRAME_DELAY;

    function scheduleRender() {
      animationFrameId = requestAnimationFrame(renderCanvas);
    }

    function renderCanvas() {
      frameCounter++;
      if (frameCounter < FRAME_DELAY) {
        scheduleRender();
        return;
      }
      frameCounter = 0;

      ghost.draw();
      scheduleRender();
    }

    ghost.img.onload = scheduleRender;
    ghost.img.src = ghostImage;

    return () => {
      ghost.img.onload = null;
      if (animationFrameId !== undefined) {
        cancelAnimationFrame(animationFrameId);
      }
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
