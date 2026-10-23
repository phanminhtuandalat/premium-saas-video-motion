import { Composition } from "remotion";
import { Hello } from "./Hello";
import { Gold, GOLD_DURATION } from "./Gold";

export const Root: React.FC = () => (
  <>
    <Composition id="Hello" component={Hello} durationInFrames={90} fps={30} width={1080} height={1920} />
    <Composition id="Gold" component={Gold} durationInFrames={GOLD_DURATION} fps={30} width={1080} height={1920} />
  </>
);
