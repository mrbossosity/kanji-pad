import { useRef } from "react";
import Canvas from "./components/Canvas";
import Header from "./components/Header";
import Toolbar from "./components/Toolbar";
import styled from "styled-components";

const AppContainer = styled.div`
    box-sizing: border-box;
    height: 100vh;
    padding: 1rem;
    display: grid;
    grid-template-rows: auto 1fr auto;
`;

function App() {
    const globalCanvas = useRef(null);
    const globalCtx = useRef(null);
    const penColor = useRef(null);
    const penWidth = useRef(10);

    return (
        <AppContainer>
            <Header></Header>
            <Canvas
                globalCanvas={globalCanvas}
                globalCtx={globalCtx}
                penColor={penColor}
                penWidth={penWidth}
            ></Canvas>
            <Toolbar
                globalCanvas={globalCanvas}
                globalCtx={globalCtx}
                penColor={penColor}
                penWidth={penWidth}
            ></Toolbar>
        </AppContainer>
    );
}

export default App;
