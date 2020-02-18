import React, { useState } from "react";
import { withAuthenticator } from "aws-amplify-react";
import Amplify, { Auth } from "aws-amplify";
import aws_exports from "./aws-exports";
import Button from "@material-ui/core/Button";
import "./App.css";
//import InputWithIcon from "./components/iconText";
//import StartCall from "./components/startCall";

Amplify.configure(aws_exports);

const App = () => {
  const [state, ibte] = useState(true);
  const state = false;
  const renderContent = () => {
    if (state) {
      return <InputWithIcon />;
    } else {
      return <StartCall />;
    }
  };

  return (
    <div className="App">
      <img src={require("./images/logo.png")} alt="logo" />
      <h1>Welcome to Amazon Topics!</h1>
      <h2>
        Leverage today's data on topic-based feedback to improve tomorrow's
        lesson
      </h2>
      <p></p>
      <Button onClick={() => ibte(false)} variant="contained" color="primary">
        {" "}
        Start a Call{" "}
      </Button>
      <p></p>
      <Button onClick={() => ibte(true)} variant="contained" color="primary">
        {" "}
        Back{" "}
      </Button>
      {}
      {renderContent()}

      {/* 
        <route path=/ component={landingPage}/>
        <route path=/startCall component={startCall}/>
        //react router
      */}

      {}
    </div>
  );
};

export default withAuthenticator(App, true);
