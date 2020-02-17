import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Input from "@material-ui/core/Input";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";

const useStyles = makeStyles(theme => ({
  margin: {
    margin: theme.spacing(1)
  }
}));

export default function InputWithIcon() {
  const classes = useStyles();

  return (
    <div>
      <FormControl className={classes.margin}>
        <InputLabel htmlFor="input-with-icon-adornment">
          Enter the title
        </InputLabel>
        <Input id="input-with-icon-adornment" />
      </FormControl>
      <FormControl className={classes.margin}>
        <InputLabel htmlFor="input-with-icon-adornment">
          Enter the name
        </InputLabel>
        <Input id="input-with-icon-adornment" />
      </FormControl>
    </div>
  );
}
