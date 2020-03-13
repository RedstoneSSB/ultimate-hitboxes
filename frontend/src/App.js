import React from 'react';

//Import css
import './css/App.css';

//Import components
import CharacterOptions from './components/CharacterOptions'
import MoveChoice from './components/MoveChoice'
import Portal from './components/Portal'
import PlayOptions from './components/PlayOptions'
import HitBoxDetail from './components/HitBoxDetail'

//Get character data (will become an api call later)
import characterData from './characterData.js'


let environment;
if (process.env.NODE_ENV === "production") {
  environment = "ultimate-hitboxes.com"
}
else {
  environment = "localhost"
}

environment = "ultimate-hitboxes.com"

class App extends React.Component {
  constructor() {
    
    super();

    //Preload loading gif
    var loadingImg = new Image()
    loadingImg.src = `./media/loading.gif`

    let playInterval;
    //State
    this.state = {

      //Basic state information for image playback
      url : "", /*URL for the frame of the image*/
      frame: 1, /*frame that the image is on, starts at 1*/
      playing: false, /*Is the video currently playing?*/

      //Data for the character and moved currently selected
      currentCharacterData: undefined,
      currentMoveData: undefined,

      //List of moves to be generated, may remove from state later
      moveList: [<MoveChoice key={0} name={"Choose a Move"} />],

      //State of the viewing portal
      //* 'initial' initial state when the page is first loaded, shows a blank portal
      //* 'loading' when a move is being loaded. Shows a loading gif and a loading percent bar
      //* 'hasMove' Move has been loaded and one of the frames of the move is currently being displayed
      portalState: "initial",

      //Current percent completion of the loading of a move
      loadingPercent: 0,

      playSpeed: 2,

      pickingCharacter: false,

      hitboxData: undefined
    }

    //Bind functions so they are usable within components
    this.incrementFrame = this.incrementFrame.bind(this)
    this.decrementFrame = this.decrementFrame.bind(this)
    this.play = this.play.bind(this)
    this.pause = this.pause.bind(this)
    this.getCharacterData = this.getCharacterData.bind(this)
    this.loadMoveList = this.loadMoveList.bind(this)
    this.setMove = this.setMove.bind(this)
    this.finishLoading = this.finishLoading.bind(this)
    this.updateSlider = this.updateSlider.bind(this)
    this.changeSpeed = this.changeSpeed.bind(this)
    this.chooseCharacter = this.chooseCharacter.bind(this)
    this.exitCharacterPicker = this.exitCharacterPicker.bind(this)
    this.updateHitboxData = this.updateHitboxData.bind(this)
    this.jumpToFrame = this.jumpToFrame.bind(this)
  }

  //Increment the frame by 1
  incrementFrame() {

    //Increase the current frame by one if the current frame is not the final frame
    if (this.state.frame < this.state.currentMoveData.frames) {
      this.setState({
        frame: this.state.frame + 1,
      })
    }
  }

  //Decrease the current frame by one if the current frame is not the first frame
  decrementFrame() {
    if (this.state.frame > 1) {
      this.setState({
        frame: this.state.frame - 1,
      })
    }
  }

  //Play the video if it is paused
  play() {
    this.setState({
      playing: true
    })

    this.playInterval = setInterval(() => {
      this.setState({
        frame: this.state.frame >= this.state.currentMoveData.frames ? 1 : this.state.frame+1
      })
    }, ((1000 / 60) * this.state.playSpeed)) /*this value represents how fast the video is played*/
  }

  //Pause the video if it is playing
  pause() {
    this.setState({
      playing: false
    })
    //Clear the interval loop
    clearInterval(this.playInterval)
  }

  //Get all data for a character
  getCharacterData(character) {

    //API call to server to get character data
    fetch(`http://${environment}:5000/${character}/data`)
      .then(response => response.json())
      .then(data => {
        //Save the character data
        this.setState({
          currentCharacterData: data,
        })

        //Call function to load the list of moves for that character
        this.loadMoveList()
      })

      //TODO: MAKE ERROR HANDLING MORE ROBUST
      .catch(err => {
        console.log("fail")
      })
  }

  //Update the list of moves to contain all the moves fetched fro mthe previous api call. SEt the current move to be the first one in the list
  loadMoveList() {
    this.setState({
      moveList: this.state.currentCharacterData.moves.map(move => <MoveChoice key={move.value} name={move.name} value={move.value} />),
      currentMoveData: this.state.currentCharacterData.moves[0],
      playing: false,
      pickingCharacter: false,
    })
    clearInterval(this.playInterval)
    this.loadMove()
  }

  setMove(event) {

    //GET data for the move to be loaded
    fetch(`http://${environment}:5000/${this.state.currentCharacterData.value}/${event.target.value}/data`)
      .then(response => response.json())
      .then(data => {

        //Set state to loading and save the data for the move
        this.setState({
          currentMoveData: data,
        })

        //Remove playing interval in case gif is playing
        clearInterval(this.playInterval)

        //Next function to load the move frames
        this.loadMove()
      })
      .catch(err => {
        console.log("Failure")
      })
  }

  loadMove() {
    this.setState({
      portalState: "loading",
    })
    //Number of frames currently loaded by browser
    var numLoaded = 0

    //Empty array to hold all the images
    var images = [];

    //Fill array with all the images, one for each frame of the move
    for (var i = 1; i <= this.state.currentMoveData.frames; i++) {
      images[i] = new Image()
      let number = characterData.find(element => element.value === this.state.currentCharacterData.value).number
      images[i].src = `https://ultimate-hitboxes.s3.amazonaws.com/frames/${number}_${this.state.currentCharacterData.value}/${this.state.currentMoveData.value}/${i}.png`
    }

    //Use an interval to halt the program while all the images load
    var loadingTimer = setInterval(function () {

      //Check how many frames have been completed
      for (var i = 1; i <= this.state.currentMoveData.frames; i++) {
        if (images[i].complete) {
          numLoaded += 1;
        }
      }

      this.setState({
        loadingPercent: (numLoaded / this.state.currentMoveData.frames) * 100
      })
      //If all frame is loaded, break out of the loop
      if (numLoaded === this.state.currentMoveData.frames) {
        clearTimeout(loadingTimer);

        //Call function to complete loading
        this.finishLoading()
        
      }

      //Else, reset counter and try again
      else {
        numLoaded = 0;
        
      }
    }.bind(this), 10)

  }

  //Move loading has been completed, display the first frame of the move
  finishLoading() {
    let number = characterData.find(element => element.value === this.state.currentCharacterData.value).number
    this.setState({
      url: `https://ultimate-hitboxes.s3.amazonaws.com/frames/${number}_${this.state.currentCharacterData.value}/${this.state.currentMoveData.value}/`,
      frame: 1,
      playing: false,
      portalState: "hasMove",
    })
  }

  updateSlider(event) {
    this.setState({
      frame: parseInt(event.target.value),
      playing: false,
    })
    clearInterval(this.playInterval)
  }

  changeSpeed(event) {
    this.setState({
      playSpeed: event.target.value,
      playing: false,
    })
    clearInterval(this.playInterval)
  }

  chooseCharacter() {
    this.setState({
      pickingCharacter: true
    })
  }

  exitCharacterPicker() {
    this.setState({
      pickingCharacter: false
    })
  }

  updateHitboxData(hitbox) {
    this.setState({
      hitboxData: hitbox
    })
  }

  jumpToFrame(frame) {

    this.setState({
      frame: frame
    })
  }
  render() {
    return (
      <div className="App">
        <h3>Smash Ultimate Hitbox Viewer</h3>

        <button style={{ "cursor": "pointer"}}
          onClick={this.chooseCharacter}
        >
        Choose a Character

          
        </button>

        <CharacterOptions
          pickingCharacter={this.state.pickingCharacter}
          characterData={characterData}
          getCharacterData={this.getCharacterData}
          exit={this.exitCharacterPicker}
        />

        <HitBoxDetail
          hitboxData={this.state.hitboxData}
          updateHitboxData={this.updateHitboxData}
        />

        <select
          name="Select Move"
          onChange={this.setMove} >
          {this.state.moveList}
        </select>

        <Portal
          url={this.state.url}
          frame={this.state.frame}
          portalState={this.state.portalState}
          width={this.state.loadingPercent}
        />

        <PlayOptions
          //Pass down boolean to show if video is playing or not
          portalState={this.state.portalState}

          //Pass down values needed by the Slider
          totalFrames={this.state.currentMoveData === undefined ? 1 : this.state.currentMoveData.frames}
          currentFrame={this.state.frame}
          change={this.updateSlider}

          //Pass down values needed by the Buttons
          incrementFrame={this.incrementFrame}
          decrementFrame={this.decrementFrame}
          playing={this.state.playing}
          play={this.play}
          pause={this.pause}

          //Pass down values needed by the Speed Options
          changeSpeed={this.changeSpeed}

          //Pass down move data for the Table
          move={this.state.currentMoveData}
          updateHitboxData={this.updateHitboxData}
          jumpToFrame={this.jumpToFrame}
        />
      </div>
    );
  }
  
}

export default App;
