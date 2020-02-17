import React from "react";
import TabPane, { Pane } from "react-split-pane";

const startCall = () => {
  return (
    <p>
      <TabPane split="vertical" minSize={50} defaultSize={100}>
        <Pane>This is a Pane</Pane>
        <Pane>This is another Pane</Pane>
      </TabPane>
    </p>
  );
};

export default startCall;
