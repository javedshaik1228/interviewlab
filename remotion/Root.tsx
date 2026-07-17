import { Composition } from "remotion";
import { InterviewLabDemo } from "./InterviewLabDemo";

export const RemotionRoot = () => (
  <Composition
    id="InterviewLabProductDemo"
    component={InterviewLabDemo}
    durationInFrames={1200}
    fps={30}
    width={1920}
    height={1080}
    defaultProps={{
      repositoryUrl: "github.com/javedshaik1228/interviewlab",
    }}
  />
);
