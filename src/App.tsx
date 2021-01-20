import React, { useRef } from 'react';
import './App.css';
import * as posenet from "@tensorflow-models/posenet";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import { drawKeypoints, drawSkeleton } from "./utilities";

tf.setBackend('webgl').then(() => { console.log('The backend is', tf.getBackend()) });


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

    // index used to keep track of what image I am on
    var imageNumber = 0;
    
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

        // displays image
        const detectionImage = loadImage()

        // detect poses
        const poses = await net.estimateMultiplePoses(detectionImage, {
            flipHorizontal: props.flipHorizontal,
            maxDetections: props.maxDetections,
            scoreThreshold: props.scoreThreshold,
            nmsRadius: props.nmsRadius
        });
        console.log(poses);

        // draw keypoints and skeleton
        drawCanvas(poses);

        setTimeout(() => {
            imageNumberChange();
            detectPoses(net);
        }, 3000)
    }

    // function to draw pose keypoints and skeleton
    const drawCanvas = (poses: any) => {

        if (canvasRef.current !== null) {

            const context = canvasRef.current.getContext('2d');

            // clear the canvas before drawing
            if (context !== null) {
                context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                context.beginPath();
            }

            // draw the keypoints and skeleton for each pose detected
            for (const pose of poses) {
                if (pose['keypoints'] === undefined) {
                    return (console.log('No poses detected'));
                }

                // the number attributes is the minimum confidence for the skeleton to be drawn.
                drawKeypoints(pose['keypoints'], 0.1, context);
                drawSkeleton(pose["keypoints"], 0.1, context);
            }
        }
    }


    const loadImage = () => {

        // creates a new img 
        const currentImage = new Image(props.imageWidth, props.imageHeight);
        currentImage.src = props.imageAddresses[imageNumber];
        currentImage.className = "center";

        // grabs img being shown in the document
        const pastImage = document.getElementById("image");

        // replaces the img in the document with the new img
        if (pastImage !== null && document.getElementById("header") !== null) {
            currentImage.id = pastImage.id;
            document.getElementById("header")?.replaceChild(currentImage, pastImage);
        }

        // return the img for posenet to use
        return (currentImage);
    }

    const imageNumberChange = () => {
        if (imageNumber === 2) {
            imageNumber = 0;
        }
        else {
            imageNumber = imageNumber + 1;
        }
    }


    loadPosenet();


  return (
      <div className="App">
          
      <header id="header" className="App-header">
              <h2> Identifying human poses with tensorflow posenet model </h2>
              <canvas
                  ref={canvasRef}
                  width={props.imageWidth}
                  height={props.imageHeight}
                  className='center'
              />
              <img
                  id="image"
                  src=""
                  alt = "Factory"
              />

      </header>
    </div>
  );
}

export default App;
