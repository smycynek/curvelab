import { createSignal, onMount, Show, type Component } from 'solid-js';
import { Point } from './Point';
import { Color } from './color';
import { Logger, toggleLog } from './Logger';
import {
  cartesianAdjust,
  drawControlPoints,
  drawCurvePointCartSegments,
  drawGridAndAxes,
  drawSamplePoint,
  getCanvas,
  getContext,
  getDrawConfig,
  getScale,
} from './drawUtil';
import { getMousePos, getTouchPos, matrixToRowArrays, near, round2f } from './utility';

import { blendSolve, hermiteBasis4x4, hermiteConstraint4x4, matrixSolve } from './hermite';
import { BlendFunctionIllustrationData } from './BlendFunctionIllustrationData';
import { MatrixIllustrationData } from './MatrixIllustrationData';
import { Vector } from './Vector';
import { Matrix } from './Matrix';
import { version } from './version';

const App: Component = () => {
  const [uSample, setUSample] = createSignal(0.5);
  const [basisData, setBasisData] = createSignal<number[][]>([]);
  const [constraintData, setConstraintData] = createSignal<number[][]>([]);
  const [matrixIllustrationData, setMatrixIllustrationData] = createSignal<MatrixIllustrationData>(
    new MatrixIllustrationData()
  );
  const [blendFunctionIllustrationData, setBlendFunctionIllustrationData] =
    createSignal<BlendFunctionIllustrationData>(new BlendFunctionIllustrationData());

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [height, setHeight] = createSignal(0);
  const [canvasWidth, setCanvasWidth] = createSignal(0);
  const [useBlendingFunctions, setUseBlendingFunctions] = createSignal(true);
  const [pointIndex, setPointIndex] = createSignal(-1);

  const standardPoints = [new Point(0, 0), new Point(4, 0), new Point(3, 3), new Point(1, -3)];

  const [points, setPoints] = createSignal([...standardPoints]);

  const init = async () => {
    if (getContext()) {
      getContext()?.clearRect(0, 0, getCanvas().width, getCanvas().height);
    }

    resizeCanvas();
    drawGridAndAxes();
    drawAllEntities();
  };

  const resizeCanvas = () => {
    const reducedHeight = window.innerHeight * 0.6;
    const roundedHeight = reducedHeight - (reducedHeight % 50);
    const reducedWidth = window.innerWidth * 0.85;
    const roundedWidth = reducedWidth - (reducedWidth % 50);

    const chosenWidth = roundedWidth > roundedHeight ? roundedHeight : roundedWidth;

    getCanvas().width = chosenWidth;
    const scale = getScale();
    getCanvas().height = chosenWidth * (2 / 3) - 2 * scale;

    setHeight(getCanvas().height);
    setCanvasWidth(getCanvas().width);
  };

  const drawAllEntities = () => {
    const ctx = getContext();
    ctx?.clearRect(0, 0, getCanvas().width, getCanvas().height);
    drawGridAndAxes();

    const config = getDrawConfig(Color.black, 1.0);
    config.solid = false;

    const tangent0 = Vector.fromTriple(points()[2].subtract(points()[0]));
    const tangent1 = Vector.fromTriple(points()[3].subtract(points()[1]));

    // Draw the curve using blending functions or a matrix solve
    if (useBlendingFunctions()) {
      const splineBlended = blendSolve(points()[0], points()[1], tangent0, tangent1, uSample());
      drawCurvePointCartSegments(splineBlended[0], getDrawConfig(Color.black, 2.0));
      setBlendFunctionIllustrationData(splineBlended[1]);
      const evalPoint = splineBlended[1]?.evalAtU ?? new Point(0, 0);

      // Draw the red sample point at u
      drawSamplePoint(evalPoint.x, evalPoint.y);
    } else {
      const splineMatrix = matrixSolve(points()[0], points()[1], tangent0, tangent1, uSample());
      setMatrixIllustrationData(splineMatrix[1]);
      drawCurvePointCartSegments(splineMatrix[0], getDrawConfig(Color.purple, 2.0));

      const evalPoint = splineMatrix[1]?.evalAtU ?? new Point(0, 0);

      // Draw the red sample point at u
      drawSamplePoint(evalPoint.x, evalPoint.y);
    }

    // Draw control points after the curve
    drawControlPoints(points());
    drawCurvePointCartSegments([points()[0], points()[2]], getDrawConfig(Color.black, 0.5));
    drawCurvePointCartSegments([points()[1], points()[3]], getDrawConfig(Color.black, 0.5));
  };

  const pointIndexAdjust = (pos: Point) => {
    const pointAdj = cartesianAdjust(pos);
    setPointIndex(-1);
    points().forEach((p: Point, idx: number) => {
      if (near(pointAdj, p) && pointIndex() !== idx) {
        setPointIndex(idx);
      }
    });
    drawAllEntities();
  };

  const moveHandler = (pt: Point) => {
    if (pointIndex() == -1) {
      return;
    }
    const newPoints = [...points()];
    newPoints[pointIndex()] = cartesianAdjust(pt);
    setPoints(newPoints);
    drawAllEntities();
  };

  const contextMenuHandler = (e: MouseEvent) => {
    e.preventDefault();
  };

  const resetButtonHandler = () => {
    setPoints([...standardPoints]);
    setUSample(0.5);
    drawAllEntities();
  };

  const toggleBlendingFunctionsHandler = () => {
    setUseBlendingFunctions(!useBlendingFunctions());
    drawAllEntities();
  };

  const mouseUpHandler = async () => {
    setPointIndex(-1);
  };

  const mouseDownHandler = (data: MouseEvent) => {
    const pos = getMousePos(getCanvas(), data);
    pointIndexAdjust(pos);
  };

  const mouseMoveHandler = (data: MouseEvent) => {
    const pt = getMousePos(getCanvas(), data);
    moveHandler(pt);
    Logger.trace(points().length + ' points');
    Logger.trace('Point index: ' + pointIndex() + '  x: ' + pt.x + '  y: ' + pt.y);
  };

  const touchEndHandler = async () => {
    setPointIndex(-1);
  };

  const touchStartHandler = (data: TouchEvent) => {
    const pos = getTouchPos(getCanvas(), data.touches[0]);
    pointIndexAdjust(pos);
  };

  const touchMoveHandler = (data: TouchEvent) => {
    const pos = getTouchPos(getCanvas(), data.touches[0]);
    if (pos.x > 0 && pos.x < getCanvas().width && pos.y > 0 && pos.y < getCanvas().height) {
      moveHandler(pos);
    }
  };

  onMount(() => {
    init();
    setBasisData(matrixToRowArrays(hermiteBasis4x4));
    setConstraintData(matrixToRowArrays(hermiteConstraint4x4));
  });

  return (
    <div onMouseUp={mouseUpHandler}>
      <header class="header">
        <h1 title="Toggle Log" onClick={[toggleLog, null]}>
          Hermite Fun
        </h1>
        <details>
          <summary>
            Drag black endpoints and green and blue tangent directions to shape the curve.
          </summary>
          Drag the
          <span class="red inline">u-value</span> slider to choose a sample u-parameter. Expand the
          sections below to see intermediate calculations for that u-value and the plotted output
          point <span class="red inline">{'\u25CF'}</span>
        </details>
      </header>
      <header class="header">
        <canvas
          title="Drag points here.  Like I said, hours of fun."
          onMouseDown={mouseDownHandler}
          onMouseMove={mouseMoveHandler}
          onTouchStart={touchStartHandler}
          onTouchEnd={touchEndHandler}
          onTouchMove={touchMoveHandler}
          class="point-canvas"
          onContextMenu={contextMenuHandler}
          id="main-canvas"
        ></canvas>
        <div class="content" style={{ width: `${canvasWidth()}px` }}>
          <div class="button-row">
            <div>
              <button
                title="Reset points to default starting positions"
                onClick={resetButtonHandler}
                class="action-button action-reset"
              >
                Reset
              </button>
            </div>
            <div>
              <button
                class="action-button action-switch"
                title="Toggle blend vs matrix evaluation"
                onClick={toggleBlendingFunctionsHandler}
              >
                Switch to {useBlendingFunctions() ? 'Matrix solve' : 'Blend functions'}
              </button>
            </div>
          </div>

          <details open>
            <summary>u value</summary>
            <table class="table-indent">
              <tbody>
                <tr>
                  <td>
                    {' '}
                    <span class="inline strong red aligned">u = {round2f(uSample())}</span>
                    <input
                      class="aligned"
                      type="range"
                      id="uSampleControl"
                      name="uSampleControlItem"
                      min="0"
                      max="1"
                      value={uSample()}
                      onInput={(e) => {
                        setUSample(Number(e.currentTarget.value));
                        drawAllEntities();
                      }}
                      step=".01"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </details>
          <details>
            <summary>Control Points</summary>
            <table class="data table-indent">
              <tbody>
                <tr>
                  <td>start (p00)</td>
                  <td>
                    <span>
                      [{round2f(points()[0].x)}, {round2f(points()[0].y)}]
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>end (p01)</td>
                  <td>
                    <span>
                      [{round2f(points()[1].x)}, {round2f(points()[1].y)}]
                    </span>
                  </td>
                </tr>

                <tr class="green">
                  <td>tangent 0 (p10)</td>
                  <td>
                    <span>
                      [{round2f(points()[2].x - points()[0].x)},{' '}
                      {round2f(points()[2].y - points()[0].y)}]
                    </span>
                  </td>
                </tr>

                <tr class="blue">
                  <td>tangent 1 (p11)</td>
                  <td>
                    <span>
                      [{round2f(points()[3].x - points()[1].x)},{' '}
                      {round2f(points()[3].y - points()[1].y)}]
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </details>

          <details>
            <summary>Matrices</summary>
            <div class="matrix-row table-indent">
              <Matrix
                caption={() => ['Constraint', 'rows: h00, h01, h10, h11']}
                data={constraintData}
                setData={setConstraintData}
              ></Matrix>
              <Matrix
                caption={() => ['Basis', 'inv(C)']}
                data={basisData}
                setData={setBasisData}
              ></Matrix>
            </div>
          </details>
          <Show when={useBlendingFunctions()}>
            <details>
              <summary>Blending functions</summary>
              <table class="table-indent">
                <caption class="strong">Coefficient = Basis Columns</caption>
                <tbody>
                  <tr>
                    <td>h00</td>
                    <td>{blendFunctionIllustrationData().h00}</td>
                  </tr>
                  <tr>
                    <td>h01</td>
                    <td>{blendFunctionIllustrationData().h01}</td>
                  </tr>
                  <tr>
                    <td>h10</td>
                    <td>{blendFunctionIllustrationData().h10}</td>
                  </tr>
                  <tr>
                    <td>h11</td>
                    <td>{blendFunctionIllustrationData().h11}</td>
                  </tr>
                </tbody>
              </table>
            </details>
            <details open>
              <summary>
                Blending calculations at
                <span class="red strong inline">
                  u = {round2f(blendFunctionIllustrationData().uSample)}
                </span>
              </summary>
              <div>
                <details>
                  <summary>Blend functions</summary>
                  <table class="table-indent">
                    <tbody>
                      <tr>
                        <td>h00({round2f(blendFunctionIllustrationData().uSample)})</td>
                        <td>{round2f(blendFunctionIllustrationData().h00Sample)}</td>
                      </tr>
                      <tr>
                        <td>h01({round2f(blendFunctionIllustrationData().uSample)})</td>
                        <td>{round2f(blendFunctionIllustrationData().h01Sample)}</td>
                      </tr>
                      <tr>
                        <td>h10({round2f(blendFunctionIllustrationData().uSample)})</td>
                        <td>{round2f(blendFunctionIllustrationData().h10Sample)}</td>
                      </tr>
                      <tr>
                        <td>h11({round2f(blendFunctionIllustrationData().uSample)})</td>
                        <td>{round2f(blendFunctionIllustrationData().h11Sample)}</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <details>
                  <summary>Blend functions * control points</summary>
                  <table class="table-indent">
                    <tbody>
                      <tr>
                        <td>h00({round2f(blendFunctionIllustrationData().uSample)})*p00.x</td>
                        <td>{round2f(blendFunctionIllustrationData().h00PointXSample)}</td>
                      </tr>
                      <tr>
                        <td>h01({round2f(blendFunctionIllustrationData().uSample)})*p01.x</td>
                        <td>{round2f(blendFunctionIllustrationData().h01PointXSample)}</td>
                      </tr>
                      <tr>
                        <td>h10({round2f(blendFunctionIllustrationData().uSample)})*p10.x</td>
                        <td>{round2f(blendFunctionIllustrationData().h10PointXSample)}</td>
                      </tr>
                      <tr>
                        <td>h11({round2f(blendFunctionIllustrationData().uSample)})*p11.x</td>
                        <td>{round2f(blendFunctionIllustrationData().h11PointXSample)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <table class="table-indent">
                    <tbody>
                      <tr>
                        <td>h00({round2f(blendFunctionIllustrationData().uSample)})*p00.y</td>
                        <td>{round2f(blendFunctionIllustrationData().h00PointYSample)}</td>
                      </tr>
                      <tr>
                        <td>h01({round2f(blendFunctionIllustrationData().uSample)})*p01.y</td>
                        <td>{round2f(blendFunctionIllustrationData().h01PointYSample)}</td>
                      </tr>
                      <tr>
                        <td>h10({round2f(blendFunctionIllustrationData().uSample)})*p10.y</td>
                        <td>{round2f(blendFunctionIllustrationData().h10PointYSample)}</td>
                      </tr>
                      <tr>
                        <td>h11({round2f(blendFunctionIllustrationData().uSample)})*p11.y</td>
                        <td>{round2f(blendFunctionIllustrationData().h11PointYSample)}</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <details open>
                  {' '}
                  <summary>Final output</summary>
                  <table class="table-indent">
                    <tbody>
                      <tr class="strong">
                        <td class="math red">u</td>
                        <td class="red">{round2f(uSample())}</td>
                      </tr>
                      <tr class="strong">
                        <td colspan="2" class="red">
                          Output: {blendFunctionIllustrationData().evalAtU?.toString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </details>
              </div>
            </details>
          </Show>

          <Show when={!useBlendingFunctions()}>
            <details open>
              <summary>X and Y parametric functions</summary>
              <table class="table-indent">
                <caption class="strong">Basis * control points = coefficients</caption>
                <tbody>
                  <tr>
                    <td>x(t)</td>
                    <td>{matrixIllustrationData().xPolynomial}</td>
                  </tr>
                  <tr>
                    <td>y(t)</td>
                    <td>{matrixIllustrationData().yPolynomial}</td>
                  </tr>
                  <tr class="strong">
                    <td class="math red">u</td>
                    <td class="red">{round2f(uSample())}</td>
                  </tr>
                  <tr class="strong">
                    <td colspan="2" class="red">
                      Output: {matrixIllustrationData().evalAtU?.toString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </details>
          </Show>
        </div>
      </header>
      <hr class="black-rule" />
      <header class="header">
        <a href="https://github.com/smycynek/curvelab">https://github.com/smycynek/curvelab</a>
        <p>{version}</p>
      </header>
    </div>
  );
};

export default App;
