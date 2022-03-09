const IMAGE_URL_START = "/images/";
const ACTION_MAP = {
  idle: 0,
  head_wagging: 1,
  looking: 1,
  walking: 2,
  running: 2,
  whacking: 3,
  coloring: 4,
  shrugging: 5,
  dying: 6,
  dead: 0,
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
  "dead",
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
const HEARTBEATS_TO_DIE = 12;
const HEARTBEATS_TO_WHACK = 10;

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function getRandomColor() {
  return ALLOWED_COLORS[getRandomInt(ALLOWED_COLORS.length)];
}

function randomly(chance, outcome) {
  switch (getRandomInt(chance)) {
    case 1:
      outcome();
      return true; //We return true if the outcome happened
  }
}

var plagueDoctorTemplate = function plagueDoctorTemplate() {
  let myElement = null; // The element rendering the gif
  let debugging = false; // Should we output debugging logs?
  //TODO: Fix scoping bug that prevents this from changing
  let dead = false;

  let currentActivity = "idle";

  // How we are rendered
  let isReversed = false; // Is the plague dr facing left?
  let currentColor = getRandomColor(); // What color are we currently?
  let currentAction = "head_wag"; // What is the dr doing?

  // When we are traveling about the page
  let targetElement; // What element are we walking to?
  let locationX = 0;
  let locationY = 0;
  let velocityX = 0;
  let velocityY = 0;

  let activityHeartbeatCount;

  //
  // UTILITY FUNCTIONS
  //
  let updateSpriteLocation = () => {
    if (debugging) {
      console.log(myElement);
    }
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

  //
  // NAVIGATION
  //
  let pickRandomElement = () => {
    let randomElement;

    do {
      randomElement = document.elementFromPoint(
        getRandomInt(window.innerWidth),
        getRandomInt(window.innerHeight)
      );
    } while (
      randomElement === document.body ||
      randomElement === myElement ||
      (randomElement && randomElement.tagName === "HTML")
    );
    return randomElement;
  };

  let getVectorToElement = (theElement) => {
    if (!theElement || !myElement) {
      return { x: 0, y: 0 };
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

    if (velocityX < -0.5) {
      isReversed = true;
      myElement.classList.add("image-reversed");
    } else {
      isReversed = false;
      myElement.classList.remove("image-reversed");
    }
  };

  let checkArrived = (vector) => {
    if (vector.y <= 1 && vector.y > -5 && Math.abs(vector.x) < 15) {
      //we are just below (in front of) our destination
      // and nearby it in the x direction
      return true;
    }
  };

  //
  // BASIC BEHAVIORS
  //
  let stop = () => {
    activityHeartbeatCount = 0;
    currentActivity = "idle";
    velocityX = 0;
    velocityY = 0;
    setSprite("idle");
  };

  let die = () => {
    setSprite("dying");
    currentActivity = "dying";
    if (activityHeartbeatCount > HEARTBEATS_TO_DIE) {
      dead = true;
      // becomeCorpse() //Too sad looking at the little corpses
      vanish();
    }
  };

  let vanish = () => {
    myElement.style.display = "none";
  };

  let becomeCorpse = () => {
    setSprite("idle");
    myElement.classList.add("dead");
  };

  let changeColor = (color) => {
    currentColor = color || getRandomColor();
  };

  let move = () => {
    locationX += velocityX;
    locationY += velocityY;
  };

  //
  // INTERACT WITH ELEMENTS
  //
  let actOnElement = () => {
    switch (getRandomInt(2)) {
      case 0:
        lookAtElement();
        break;
      case 1:
        whackElement();
        break;
    }
  };

  let lookAtElement = () => {
    currentActivity = "looking";
    setSprite("looking");
  };

  let walkToElement = (theElement) => {
    if (theElement) {
      console.log(theElement);
      targetElement = theElement;
      currentActivity = "walking";
      setSprite("walking");
    }

    //We actually want to pick a point here, not the element itself.
    const vector = getVectorToElement(targetElement);
    if (checkArrived(vector)) {
      stop();
      actOnElement();
    } else {
      setVelocity(vector);
      move();
    }
  };

  let whackElement = () => {
    let doctorWhacks;
    if (currentActivity !== "whacking") {
      currentActivity = "whacking";
      setSprite("whacking");
      activityHeartbeatCount = 0;
    }
    if (activityHeartbeatCount % HEARTBEATS_TO_WHACK === 0) {
      doctorWhacks = parseInt(targetElement.getAttribute("doctor-whacks")) || 0;
      if (isReversed) {
        doctorWhacks--;
      } else {
        doctorWhacks++;
      }
      targetElement.setAttribute("doctor-whacks", doctorWhacks);
      targetElement.style.transform = `rotate(${doctorWhacks}deg)`;
    }
  };

  //
  // USER INTERACTIONS
  //

  const addEventListeners = () => {
    myElement.addEventListener("click", () => {
      // TODO: Detect whether it was in the center or periphery of the element
      // If periphery, make him scared for a second, then run for cover
      activityHeartbeatCount = 0;
      die();

      window.setTimeout(() => {
        PlagueDoctorFactory.createPlagueDoctor().init();
      }, (getRandomInt(10) + 5) * 1000);
    });
  };

  // HIGH-LEVEL BEHAVIORS
  let doSomething = () => {
    if (dead) {
      return;
    }
    switch (currentActivity) {
      case "idle": {
        randomly(10, () => {
          walkToElement(pickRandomElement());
        });
        break;
      }
      case "walking": {
        walkToElement();
        randomly(500, () => {
          stop();
          changeColor();
        });
        break;
      }
      case "looking": {
        randomly(20, () => {
          stop();
        });
        break;
      }
      case "dying": {
        die();
        break;
      }
      case "whacking": {
        whackElement();
        randomly(20, () => {
          stop();
          lookAtElement();
        });
        break;
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

    addEventListeners();

    heartbeat = window.setInterval(() => {
      if (debugging) {
        console.log("❤️ ", statusString());
      }
      activityHeartbeatCount++;
      doSomething();
      updateSpriteLocation();
    }, HEATBEAT_INTERVAL);
  };

  return {
    init,
    setSprite,
    stop,
    walkToElement,
    debugging,
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
  let enableDebugging = (value) => {
    for (i = 0; i < plagueDoctors.length; i++) {
      plagueDoctors[i].debugging = value;
    }
  };
  let init = (numDoctors) => {
    for (i = 0; i < numDoctors; i++) {
      plagueDoctors.push(PlagueDoctorFactory.createPlagueDoctor());
      plagueDoctors[i].init();
    }
  };

  return {
    init,
    enableDebugging,
  };
})();

PlagueDoctors.init(1);
