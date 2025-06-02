import { Grid } from "./Grid";
import { Cards } from "./notebook/Cards";

export const Notebook = () => {
  return (
    <Grid>
      <Cards col={2} row={2} />
    </Grid>
  );
};
