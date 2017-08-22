ArrayList<String> header;
ArrayList<ArrayList<String>> dataList;
import de.voidplus.leapmotion.*;
LeapMotion leap;

int saveCount; 
int currentType;

void setup() {  
  size(800, 500);
  background(255);
  leap = new LeapMotion(this);
  init();
  
  saveCount = 0;
}

void draw() {
  background(255);
  int fps = leap.getFrameRate();
  textSize(14);
  textAlign(LEFT, CENTER);
  for (Hand hand : leap.getHands ()) {
    hand.draw();
  }

  pushStyle();
  fill(0);
  textSize(24);
  textAlign(LEFT, TOP);
  text(types[currentType], 0, 0);
  image(imgs[currentType], 0, 24);
  text(saveCount, 0, 24 + 100);
  popStyle();
}

void keyPressed() {
  if (key == 'a') {
    addList(dataList);
    saveCount++;
  } else if (key == 'e') {
    // ******* Export File *******
    String name = genNextFilePath();
    saveCSV(name + ".csv");
    saveMetaJSON(name + ".json");
    dataList.clear();
  } else if (key == ' ') {
    currentType++;
    if (currentType >= types.length) {
      currentType = 0;
    }
  }
}

void leapOnInit() {
  println("Leap Motion Init");
}
void leapOnConnect() {
  println("Leap Motion Connect");
}
void leapOnFrame() {
  // println("Leap Motion Frame");
}
void leapOnDisconnect() {
  println("Leap Motion Disconnect");
}
void leapOnExit() {
  println("Leap Motion Exit");
}