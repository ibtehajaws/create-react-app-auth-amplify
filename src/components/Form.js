import React from "react";
import TextField from "@material-ui/core/TextField";

const StartForm = () => {
  return (
    <form>
      <TextField
        id="outlined-secondary"
        label="Enter your student's name"
        variant="outlined"
        color="secondary"
      />
      <TextField
        id="outlined-secondary"
        label="Outlined secondary"
        variant="outlined"
        color="secondary"
      />
    </form>
  );
};

export default StartForm;
