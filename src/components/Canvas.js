import { useEffect, useRef } from "react";
import styled from "styled-components";

const CanvasContainer = styled.div`
    margin-top: 1rem;
    margin-bottom: 1rem;
`;

const MyCanvas = styled.canvas`
    background-color: #ddd;
`;

function Canvas({ globalCanvas, globalCtx, penColor, penWidth }) {
    const canvasRef = useRef(null);
    const divRef = useRef(null);
    const isDrawing = useRef(false);

    const prevX = useRef(null);
    const prevY = useRef(null);
    const touchPrevX = useRef(null);
    const touchPrevY = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        globalCanvas.current = canvasRef.current;
        const ctx = canvas.getContext("2d");
        globalCtx.current = canvas.getContext("2d");

        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const penStart = (e) => {
            isDrawing.current = true;
            ctx.lineWidth = penWidth.current;
            ctx.strokeStyle = penColor.current;
        };

        const penEnd = (e) => {
            isDrawing.current = false;
            touchPrevX.current = null;
            touchPrevY.current = null;
            ctx.beginPath();
        };

        const canvasMouseMove = (e) => {
            if (
                prevX.current == null ||
                prevY.current == null ||
                !isDrawing.current
            ) {
                prevX.current = e.clientX - rect.left;
                prevY.current = e.clientY - rect.top;
                return;
            }

            let currentX = e.clientX - rect.left;
            let currentY = e.clientY - rect.top;

            ctx.beginPath();
            ctx.moveTo(prevX.current, prevY.current);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();

            prevX.current = currentX;
            prevY.current = currentY;
        };

        const canvasTouchMove = (e) => {
            if (
                touchPrevX.current == null ||
                touchPrevY.current == null ||
                !isDrawing.current
            ) {
                touchPrevX.current = e.targetTouches[0].pageX - rect.left;
                touchPrevY.current = e.targetTouches[0].pageY - rect.top;
                return;
            }

            let currentX = e.targetTouches[0].pageX - rect.left;
            let currentY = e.targetTouches[0].pageY - rect.top;

            ctx.beginPath();
            ctx.moveTo(touchPrevX.current, touchPrevY.current);
            ctx.lineTo(currentX, currentY);
            ctx.stroke();

            touchPrevX.current = currentX;
            touchPrevY.current = currentY;
        };

        canvas.addEventListener("mousedown", penStart);
        canvas.addEventListener("touchstart", penStart);

        canvas.addEventListener("mousemove", canvasMouseMove);
        canvas.addEventListener("touchmove", canvasTouchMove);

        canvas.addEventListener("mouseup", penEnd);
        canvas.addEventListener("touchend", penEnd);

        return () => {
            canvas.removeEventListener("mousedown", penStart);
            canvas.removeEventListener("touchstart", penStart);
            canvas.removeEventListener("mouseup", penEnd);
            canvas.removeEventListener("touchend", penEnd);
            canvas.removeEventListener("mousemove", canvasMouseMove);
            canvas.removeEventListener("touchmove", canvasMouseMove);
        };
    }, []);

    return (
        <CanvasContainer ref={divRef}>
            <MyCanvas ref={canvasRef}></MyCanvas>
        </CanvasContainer>
    );
}

export default Canvas;
