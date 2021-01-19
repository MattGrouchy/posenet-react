import React, { useRef, useState } from 'react';
import './App.css';
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { drawKeypoints, drawSkeleton } from "./utilities";

tf.setBackend('webgl').then(() => { console.log('The backend is', tf.getBackend()) });
///console.log(tf.getBackend());
//tf.setBackend('webgl')

export interface AppProps {
    imageWidth: 640,
    imageHeight: 360,
    // load posenet params
    architecture: "MobileNetV1",
    outputStride: 8, // can be 8, 16, 32. Larger value increases speed at loss of accuracy
    multiplier: 0.75, // recommended at 0.75 for computers with mid-range GPUs
    // estimate multiple poses params
    flipHorizontal: false, // used to reverse images that a flipped by default ie.a webcam
    maxDetections: 5, // 5 is the default value, not sure how many it can go up to
    scoreThreshold: 0.1, // default 0.5. minimum root part score for returned detection
    nmsRadius: 2, // defaults to 20. two parts suppress each other is they are nmsRadius pixels apart
    imageAddresses: ["/snapshots/946685100016.jpg", "/snapshots/946685101016.jpg", "/snapshots/946685102016.jpg"],
    id: "canvasID",
    timeStep: 2000

}

App.defaultProps = {
    imageWidth: 640,
    imageHeight: 360,
    // load posenet params
    architecture: "MobileNetV1",
    outputStride: 8, // can be 8, 16, 32. Larger value increases speed at loss of accuracy
    multiplier: 0.75, // recommended at 0.75 for computers with mid-range GPUs
    // estimate multiple poses params
    flipHorizontal: false, // used to reverse images that a flipped by default ie.a webcam
    maxDetections: 5, // 5 is the default value, not sure how many it can go up to
    scoreThreshold: 0.6, // default 0.5. minimum root part score for returned detection
    nmsRadius: 20, // defaults to 20. two parts suppress each other is they are nmsRadius pixels apart
    imageAddresses: ["/snapshots/946685100016.jpg", "/snapshots/946685101016.jpg", "/snapshots/946685102016.jpg"],
    id: "canvasID",
    timeStep: 2000
}



function App(props: AppProps) {

    const imageNumber = 0;
    //currentImageElement is being used in the detection
    const currentImageElement = new Image(props.imageWidth, props.imageHeight);
    const canvasRef = useRef<HTMLCanvasElement>(null);


    const loadPosenet = async () => {
        const net = await posenet.load({
            architecture: props.architecture,
            outputStride: props.outputStride,
            inputResolution: { width: props.imageWidth, height: props.imageHeight },
            multiplier: props.multiplier
        });
        detectPoses(net);
    }

    const detectPoses = async (net: any) => {
        currentImageElement.src = props.imageAddresses[imageNumber]

        const poses = await net.estimateMultiplePoses(currentImageElement, {
            flipHorizontal: props.flipHorizontal,
            maxDetections: props.maxDetections,
            scoreThreshold: props.scoreThreshold,
            nmsRadius: props.nmsRadius
        });
        console.log(poses);
        drawCanvas(poses);
    }


    const drawCanvas = (poses: any) => {
      
        if (canvasRef.current !== null) {
            const context = canvasRef.current.getContext('2d');

            for (const pose of poses) {
                if (pose['keypoints'] === undefined) {
                    return (console.log('No poses detected'));
                }
                drawKeypoints(pose['keypoints'], 0.1, context);
                drawSkeleton(pose["keypoints"], 0.1, context);
            }
        }
        
    }

    loadPosenet();


  return (
    <div className="App">
      <header className="App-header">
              <h1> posenet-d </h1>
              <h2> Using posenet on images </h2>
              <DetectedImage {...props} />
              <canvas
                  ref={canvasRef}
                  width={props.imageWidth}
                  height={props.imageHeight}
                  className='center'
              />
      </header>
    </div>
  );
}


function DetectedImage(props: any) {

    const [imageNumber, setImageNumber] = useState(0)

    const imageChange = () => {

        //checks to see if placeholder has reached the end of images
        if (imageNumber === props.imageAddresses.length - 1) {
            setImageNumber(0)
        }

        // sets imageplace holder to next image.
        else {
            setImageNumber(imageNumber + 1)
        }
    }

    //setTimeout(() => imageChange(), props.timeStep);


    return (
        <div>
            <img id="imageID"
                //ref={imageRef}
                alt="factory"
                width={props.imageWidth}
                height={props.imageHeight}
                src={props.imageAddresses[imageNumber]}
                className='center'
            /> 
        </div>
        )

}

export default App;
