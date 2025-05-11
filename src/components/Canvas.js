import { useEffect, useRef } from "react";
import styled from "styled-components";

const CanvasContainer = styled.div`
    margin-top: 1rem;
    margin-bottom: 1rem;
    touch-action: none;
`;

const MyCanvas = styled.canvas`
    background-color: #ddd;
`;

function Canvas({ globalCanvas, globalCtx, penColor, penWidth }) {
    const canvasRef = useRef(null);
    const divRef = useRef(null);
    const isDrawing = useRef(false);

    const lastPoint = useRef(null);
    const points = useRef([]);

    useEffect(() => {
        const canvas = canvasRef.current;
        globalCanvas.current = canvasRef.current;
        const ctx = canvas.getContext("2d");
        globalCtx.current = canvas.getContext("2d");

        const div = divRef.current;
        const rect = div.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        const recordPoint = (x, y, time) => {
            points.current.push({ x, y, time });
        };

        const interpolatePoints = (p1, p2) => {
            const distance = Math.sqrt(
                Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
            );
            const numPoints = Math.max(1, Math.floor(distance / 5));
            const interpolated = [];
            for (let i = 1; i < numPoints; i++) {
                const t = i / numPoints;
                interpolated.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t,
                    time: p1.time + (p2.time - p1.time) * t,
                });
            }
            return interpolated;
        };

        const drawPath = (strokePoints) => {
            if (strokePoints.length < 2) return;

            ctx.beginPath();
            ctx.moveTo(strokePoints[0].x, strokePoints[0].y);

            for (let i = 1; i < strokePoints.length - 1; i++) {
                const p0 = strokePoints[i - 1];
                const p1 = strokePoints[i];
                const p2 = strokePoints[i + 1];

                const v01 = { x: p1.x - p0.x, y: p1.y - p0.y };
                const v12 = { x: p2.x - p1.x, y: p2.y - p1.y };

                const dotProduct = v01.x * v12.x + v01.y * v12.y;
                const magnitude01 = Math.sqrt(v01.x * v01.x + v01.y * v01.y);
                const magnitude12 = Math.sqrt(v12.x * v12.x + v12.y * v12.y);

                let angle = Math.acos(dotProduct / (magnitude01 * magnitude12));

                let smoothingFactor = 0.2;
                const sharpAngleThreshold = Math.PI / 3;

                if (angle > sharpAngleThreshold) {
                    smoothingFactor = 0.05;
                }

                const controlX = p1.x + (p0.x - p2.x) * smoothingFactor;
                const controlY = p1.y + (p0.y - p2.y) * smoothingFactor;

                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;

                ctx.quadraticCurveTo(controlX, controlY, midX, midY);

                const prevPoint = strokePoints[i - 1] || p1;
                const deltaTime = p1.time - prevPoint.time;
                const distance = Math.sqrt(
                    Math.pow(p1.x - prevPoint.x, 2) +
                        Math.pow(p1.y - prevPoint.y, 2)
                );
                const speed = deltaTime > 0 ? distance / deltaTime : 0;
                const baseWidth = penWidth.current;
                const speedFactor = 2;
                const minWidthFactor = 0.3;
                const maxWidthFactor = 2.5;
                let lineWidth = baseWidth * (1 + speed * speedFactor * 0.0005);
                lineWidth = Math.max(
                    baseWidth * minWidthFactor,
                    Math.min(lineWidth, baseWidth * maxWidthFactor)
                );
                ctx.lineWidth = lineWidth;
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(midX, midY);
            }
            ctx.lineTo(
                strokePoints[strokePoints.length - 1].x,
                strokePoints[strokePoints.length - 1].y
            );
            ctx.stroke();
        };

        const predictPoints = (currentPoints) => {
            if (currentPoints.length < 3) return [];

            const windowSize = Math.min(5, currentPoints.length);
            let avgX = 0;
            let avgY = 0;
            let avgDX = 0;
            let avgDY = 0;
            let lastTime = currentPoints[currentPoints.length - 1].time;
            let prevTime =
                currentPoints[Math.max(0, currentPoints.length - 2)].time;
            let deltaTime =
                prevTime !== lastTime ? lastTime - prevTime : 1000 / 60;

            for (
                let i = currentPoints.length - windowSize;
                i < currentPoints.length;
                i++
            ) {
                avgX += currentPoints[i].x;
                avgY += currentPoints[i].y;
                if (i > 0) {
                    avgDX += currentPoints[i].x - currentPoints[i - 1].x;
                    avgDY += currentPoints[i].y - currentPoints[i - 1].y;
                }
            }

            avgX /= windowSize;
            avgY /= windowSize;
            avgDX /= windowSize - 1 || 1;
            avgDY /= windowSize - 1 || 1;

            const predictedX = avgX + avgDX * 1.2;
            const predictedY = avgY + avgDY * 1.2;
            const predictedTime = lastTime + deltaTime;

            return [{ x: predictedX, y: predictedY, time: predictedTime }];
        };

        const handleStart = (e) => {
            isDrawing.current = true;
            points.current = [];
            lastPoint.current = getPosition(e);
            recordPoint(lastPoint.current.x, lastPoint.current.y, Date.now());
        };

        const handleMove = (e) => {
            if (!isDrawing.current) return;

            const currentPoint = getPosition(e);
            const currentTime = Date.now();
            recordPoint(currentPoint.x, currentPoint.y, currentTime);

            const newPoints = interpolatePoints(lastPoint.current, {
                ...currentPoint,
                time: currentTime,
            });
            newPoints.forEach((p) => recordPoint(p.x, p.y, p.time));

            const allPoints = [...points.current];
            const predicted = predictPoints(allPoints);
            drawPath([...allPoints, ...predicted]);

            lastPoint.current = currentPoint;
        };

        const handleEnd = () => {
            if (!isDrawing.current) return;
            isDrawing.current = false;
            points.current = [];
            lastPoint.current = null;
            ctx.beginPath();
        };

        const getPosition = (e) => {
            const rect = canvas.getBoundingClientRect();
            if (e.clientX !== undefined) {
                return {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                };
            } else {
                return {
                    x: e.targetTouches[0].pageX - rect.left,
                    y: e.targetTouches[0].pageY - rect.top,
                };
            }
        };

        canvas.addEventListener("mousedown", handleStart);
        canvas.addEventListener("touchstart", handleStart);

        canvas.addEventListener("mousemove", handleMove);
        canvas.addEventListener("touchmove", handleMove);

        canvas.addEventListener("mouseup", handleEnd);
        canvas.addEventListener("touchend", handleEnd);
        canvas.addEventListener("mouseout", handleEnd);

        return () => {
            canvas.removeEventListener("mousedown", handleStart);
            canvas.removeEventListener("touchstart", handleStart);
            canvas.removeEventListener("mousemove", handleMove);
            canvas.removeEventListener("touchmove", handleMove);
            canvas.removeEventListener("mouseup", handleEnd);
            canvas.removeEventListener("touchend", handleEnd);
            canvas.removeEventListener("mouseout", handleEnd);
        };
    }, [penColor, penWidth]);

    return (
        <CanvasContainer ref={divRef}>
            <MyCanvas ref={canvasRef}></MyCanvas>
        </CanvasContainer>
    );
}

export default Canvas;
