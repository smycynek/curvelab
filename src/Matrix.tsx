import { For, type Component } from 'solid-js';

interface DataInputProps {
  data: () => number[][];
  setData(d: number[][]): void;
  caption: () => string[];
}

// TODO, have Matrix component accept matrix from mathjs
export const Matrix: Component<DataInputProps> = (props) => {
  return (
    <div>
      <table class="matrix-container matrix">
        <caption>
          <div class="strong">{props.caption()[0]}</div>
          <div>{props.caption()[1]}</div>
        </caption>
        <For each={props.data()}>
          {(dataItem) => (
            <tr>
              <For each={dataItem}>{(cell) => <td class="matrix-item">{cell}</td>}</For>
            </tr>
          )}
        </For>
      </table>
    </div>
  );
};
