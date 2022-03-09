const IMAGE_URL_START = "/images/";
const ACTION_MAP = {
  idle: 0,
  head_wagging: 1,
  looking: 1,
  walking: 2,
  running: 2,
  whack: 3,
  coloring: 4,
  shrugging: 5,
  dying: 6,
};
const ALLOWED_ACTIVITIES = [
  "idle",
  "head_wagging",
  "walking",
  "running",
  "whacking",
  "looking",
  "coloring",
  "shrugging",
  "dying",
];
const TARGETED_ACTIVITIES = {
  walking: "to",
  running: "to",
  looking: "at",
  coloring: "",
};
const SPEEDS = {
  walking: 10,
  running: 20,
};
const ALLOWED_COLORS = ["red", "orange", "yellow", "green", "blue", "purple"];
const COLOR_MAP = {
  red: { dark: "#ca1c1d", medium: "#e60000", light: "#ff2525" },
  orange: { dark: "#ca671d", medium: "#e66300", light: "#ff8325" },
  yellow: { dark: "#c0cb1d", medium: "#d9e600", light: "#f2ff25" },
  green: { dark: "#55a83f", medium: "#55a83f", light: "#64bc2a" },
  blue: { dark: "#1d96ca", medium: "#00a1e6", light: "#25beff" },
  purple: { dark: "#a61dca", medium: "#b600e6", light: "#d225ff" },
};
const HEATBEAT_INTERVAL = 100;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

var plagueDoctorTemplate = function plagueDoctorTemplate() {
  let myElement = null; // The element rendering the gif

  let currentActivity = "idle";
  let currentAnimationFrame = 0;

  // How we are rendered
  let isReversed = false; // Is the plague dr facing left?
  let currentColor = "green"; // What color are we currently?
  let currentAction = "head_wag"; // What is the dr doing?

  // When we are traveling about the page
  let targetElement; // What element are we walking to?
  let locationX = 0;
  let locationY = 0;
  let velocityX = 0;
  let velocityY = 0;

  let heartbeat;

  //
  // UTILITY FUNCTIONS
  //
  let updateSpriteLocation = () => {
    console.log(myElement);
    myElement.style.left = locationX + "px";
    myElement.style.top = locationY + "px";
  };
  let statusString = () => {
    return `At (${locationX},${locationY}), ${currentActivity} ${
      Object.keys(TARGETED_ACTIVITIES).includes(currentActivity)
        ? `${
            TARGETED_ACTIVITIES[currentActivity]
          } ${targetElement.classList.toString()}`
        : ""
    }`;
  };

  let setLocation = (x, y) => {
    locationX = x;
    locationY = y;
  };

  let getElementBottom = (element) => {
    const rect = element.getBoundingClientRect();
    return rect.top + rect.height;
  };

  //
  // SPRITE MANAGEMENT
  //
  let buildImageUrl = (action, color) => {
    if (!ALLOWED_COLORS.includes(color)) {
      console.error("Error: non-valid color specified");
    }
    return `${IMAGE_URL_START}plague-doctor-gif${ACTION_MAP[action]}_${color}.gif`;
  };

  let setSprite = (action, color = currentColor) => {
    if (currentAction === action && color === currentColor) {
      return; //We are already using the correct src. No need to change
    }
    myElement.src = buildImageUrl(action, color);
    currentAction = action;
    currentColor = color;
  };

  let pickRandomElement = () => {
    let randomElement;

    do {
      randomElement = document.elementFromPoint(
        getRandomInt(window.innerWidth),
        getRandomInt(window.innerHeight)
      );
    } while (randomElement === document.body || randomElement === myElement);
    return randomElement;
  };

  let getVectorToElement = (theElement) => {
    if (!theElement || !myElement) {
      return;
    }
    let myBox = myElement.getBoundingClientRect();
    let theirBox = theElement.getBoundingClientRect();
    let xDistance = theirBox.x - myBox.x + myBox.width;
    let yDistance = theirBox.y + theirBox.height - (myBox.y + myBox.height);

    return { x: xDistance, y: yDistance };
  };

  let setVelocity = (vector) => {
    const totalDistance = Math.abs(vector.x) + Math.abs(vector.y);
    const speed = SPEEDS[currentActivity];
    if (!speed) {
      return;
    }
    velocityX = speed * (vector.x / totalDistance);
    velocityY = speed * (vector.y / totalDistance);
  };

  let checkArrived = (vector) => {
    if (vector.y <= 0 && vector.y > -5 && Math.abs(vector.x) < 10) {
      //we are just below (in front of) our destination
      // and nearby it in the x direction
      return true;
    }
  };

  // BASIC BEHAVIORS
  let stop = () => {
    currentActivity = "idle";
    velocityX = 0;
    velocityY = 0;
  };

  let move = () => {
    locationX += velocityX;
    locationY += velocityY;
  };

  let walkToElement = (theElement) => {
    if (theElement) {
      targetElement = theElement;
      currentActivity = "walking";
      setSprite("walking");
    }

    //We actually want to pick a point here, not the element itself.
    const vector = getVectorToElement(targetElement);
    if (checkArrived(vector)) {
      stop();
    } else {
      setVelocity(vector);
      move();
    }
  };

  // HIGH-LEVEL BEHAVIORS
  let doSomething = () => {
    switch (currentActivity) {
      case "idle": {
        switch (getRandomInt(10)) {
          case 1:
            walkToElement(pickRandomElement());
        }
      }
      case "walking": {
        walkToElement();
      }
    }
  };

  let init = () => {
    myElement = document.createElement("img");
    setLocation(20, 20);
    myElement.classList.add(
      "plague-doctor-element",
      "plague-doctor-element-init"
    );
    window.setTimeout(() => {
      myElement.classList.toggle("plague-doctor-element-init");
    }, 400);
    setSprite("idle");
    document.body.appendChild(myElement);

    heartbeat = window.setInterval(() => {
      console.log("❤️ ", statusString());
      doSomething();
      updateSpriteLocation();
    }, HEATBEAT_INTERVAL);
  };

  return {
    init,
    setSprite,
    stop,
    walkToElement,
  };
};

var PlagueDoctorFactory = (function () {
  let createPlagueDoctor = () => {
    let newDoctor = new Function(
      "return " + plagueDoctorTemplate.toString()
    )()();
    return newDoctor;
  };
  return {
    createPlagueDoctor,
  };
})();

var PlagueDoctors = (function () {
  let plagueDoctors = [];
  let init = (numDoctors) => {
    for (i = 0; i < numDoctors; i++) {
      plagueDoctors.push(PlagueDoctorFactory.createPlagueDoctor());
      plagueDoctors[i].init();
    }
  };

  return {
    init,
  };
})();

PlagueDoctors.init(1);