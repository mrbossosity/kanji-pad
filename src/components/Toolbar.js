import styled from "styled-components";

const ToolbarContainer = styled.div`
    color: #ddd;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
`;

function Toolbar({ globalCanvas, globalCtx, penColor, penWidth }) {
    return (
        <ToolbarContainer>
            <input
                type="color"
                onChange={(e) => (penColor.current = e.target.value)}
            ></input>
            <input
                type="range"
                min="1"
                max="25"
                defaultValue="10"
                onChange={(e) => {
                    penWidth.current = e.target.value;
                }}
            ></input>
            <button
                onClick={() => {
                    const canvas = globalCanvas.current;
                    const ctx = globalCtx.current;
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }}
            >
                Clear
            </button>
        </ToolbarContainer>
    );
}

export default Toolbar;
