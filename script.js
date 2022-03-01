'use strict';


const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////////////////////////////////////////////// DATA ////////////////////////////////////////////
//create the PARENT class
class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  description;
  click = 0;

  constructor(coords, distance, duration) {
    this.coords = coords; //has to be and array [lat, lgn]
    this.distance = distance;
    this.duration = duration;
  }
 //method to set workout description
 _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`
 }
 _increaseClick() {
   this.click++
 }
}

//creating CHILDREN CLASS with specific properties and methods
class Running extends Workout {
  type = 'running' //add the class field here, useful for template literal and other stuff
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration); //set the THIS keyword to parent class
    this.cadence = cadence;
    this.calcPace();
    this._setDescription() //i have to call method to set description, otherwise won't run itself
  }
//methods
  calcPace() {// usually min/km
    this.pace = this.duration / this.distance // this.pace to add the new property
  }
}


class Cycling extends Workout {
  type = 'cycling' //add the class field here, useful for template literal and other stuff
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration); //set the THIS keyword to parent class
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription() //i have to call method to set description, otherwise won't run itself
  }
//methods
  calcSpeed() {// usually km/h --> pay attention to convert time input from minutes to hour
    this.speed = this.distance / (this.duration / 60); // this.speed to add the new property
  }
}














//////////////////////////////////////////////////////////////////////////////////////////////////
//APPLICATION ARCHITECTURE
class App {
  #map; //moving here inside the class the global variables. They are private
  #mapEvent;
  #workouts = []; //the workout array

  constructor() {
    this._getPosition(); //immediately call this method to get the position

    this.clickFormHandlerNewWorkout = this._newWorkout.bind(this); //create the REFERENCE to later remove event handler
    form.addEventListener('submit', this.clickFormHandlerNewWorkout); //handle the SUBMIT event in the workout form to display the marker
    inputType.addEventListener('change', this._toggleElevationField); //toggle elevation field
  //handle events on workouts list using EVENT DELEGATION
    containerWorkouts.addEventListener('click', this._moveMarker.bind(this));
    containerWorkouts.addEventListener('click', this._editDeletWorkout.bind(this)); //
  //event handler to clear the workouts
    document.querySelector('.btn__reset').addEventListener('click', this._resetWorkouts);
  //get data from localstorage
    this._getLocalStorage();
  }

  //the methods=======================================================================================
  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () { //second callback function in case of error
          alert(`Couldn't get your position`);
        }
      );
  }
//----------------------------------------------------------========-------------END OF _getPosition()
  _loadMap(position) {
    //pass a Position Parameter
    //using destructuring i can take from the object the exact property based on the variable name.
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude]; //creating an array with coordinates
    //create a link for Google Maps
    console.log(`https://www.google.pl/maps/@${latitude},${longitude}`);

    //insert LEAFLET code for the map
    this.#map = L.map('map').setView(coords, 10); //reassing the global variable

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);


    //call the method to show the form, here after #map is defined
    this.#map.on('click', this._showForm.bind(this));

    //restore MARKER after retrieving data from LOCAL STORAGE
    this.#workouts.forEach(it => this._renderWorkoutMarker(it));
  }
//-----------------------------------------------------------------------------------END OF _loadMap()
  _showForm(mapE) { // Handling the click on Map - RENDER WORKOUT INPUT FORM
    this.#mapEvent = mapE; //assigning to the global variable
    form.classList.remove('hidden'); //make form appears
    inputDistance.focus(); //pointer already on
  }
//---------------------------------------------------------------------------------END OF _showForm()
  _setFormFields(distance, duration, cadence, elevGain) { //setting form
    inputDistance.value = distance;
    inputDuration.value = duration;
    inputCadence.value = cadence;
    inputElevation.value = elevGain;
  }
//---------------------------------------------------------------------------------END OF _setFormFields()
  _toggleElevationField() {
    //remember, i have to work on the the container, not on the fields -->DOM travesing-->closest()
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
  }
//----------------------------------------------------------------------END OF _toggleElevationField()
  _newWorkout(e) {
    e.preventDefault(); //prevent default behaviour (reloading page)

    //functions to check inserted data
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const positiveInput = (...inputs) => inputs.every(inp => inp > 0);
    //GET THE DATA FROM THE FORM
    const type = inputType.value; //the value is in HTML
    const distance = +inputDistance.value; //+ to converto to number, since it comes as STRING
    const duration = +inputDuration.value;
    //the coordinates
    const { lat, lng } = this.#mapEvent.latlng;
    //the workout variable will be pushed
    let workout;

    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (!validInput(distance, duration, cadence) || //guard clause, if this is not true RETURN the alert
        !positiveInput(distance, duration, cadence))
        return alert(`Input have to be positive numbers!`);
      //otherwise...define the workout object finally! (variable defined outside)
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    if (type === 'cycling') {
      const elevationGain = +inputElevation.value;
      if (!validInput(distance, duration, elevationGain) || //guard clause, if this is not true RETURN the alert
        !positiveInput(distance, duration)) //here i pass only the two parameters)
        return alert(`Input have to be positive numbers!`);
      //otherwise...define the workout object finally! (variable defined outside)
      workout = new Cycling([lat, lng], distance, duration, elevationGain);
    }

    //PUSH WORKOUT OBJECT TO "WORKOUTS" ARRAY
    this.#workouts.push(workout);

    //render the marker, call the function
    this._renderWorkoutMarker(workout);
    this._renderWorkout(workout);
    this._hideForm(); //call the method to hide the form after submitting new workout
    this._setLocalStorage(); //store #workouts array to the Local Storage after submitting new one
  }
//-------------------------------------------------------------------------------END OF _newWorkout()

  _renderWorkoutMarker(workout) {
    //refactor function to render workout
    L.marker(workout.coords) //get lat and lng from the mapEvent and set the popup on the map
      .addTo(this.#map)
      .bindPopup(
        //pass options for the popupt. Find all the info in the documentation
        L.popup({
          maxWith: 250,
          minWith: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`, //set the class to the popup
        })
      )
      .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`) //the text in the popup
      .openPopup();
  }
//---------------------------------------------------------------------END OF _renderWorkoutMarker()

  _renderWorkout(workout) {
    //THE COMMON PART
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}
          <button class="xedit__btn edit--btn">Edit</button>
          <button class="xedit__btn delete--btn">Delete</button></h2>
          <div class="workout__details">
            <span class="workout__icon">${
              workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>`;
    //NOT COMMON PART --> i will add code to html variable
    if (workout.type === "running") html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(2)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`;

    if (workout.type === "cycling") html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(2)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`;

    //DOM manipulation insert the HTML
    form.insertAdjacentHTML('afterend', html);

  }
//---------------------------------------------------------------------------END OF _renderWorkout()

  _hideForm() {
    //clear input fields after submitting MOVED HERE
    this._setFormFields('','','','')
    form.style.display = 'none';  //hide the form NOT USEFUL WITH NEW ANIMATIONS
    form.classList.add('hidden'); //re add hidden class
    setTimeout(() => form.style.display = 'grid', 1000); //restore grid property after 1 second
  }
//---------------------------------------------------------------------------END OF _hideForm()


  _moveMarker(e) {
    const clickWorkout = e.target.closest('.workout');
    
    if (!clickWorkout) return; //guard clause
    const id = clickWorkout.dataset.id; //id to connect click and workout object
    const clikedWorkout = this.#workouts.find(item => item.id === id)
    this.#map.setView(clikedWorkout.coords);
    
    //increase click count
    // clikedWorkout._increaseClick();
  }
//---------------------------------------------------------------------------END OF _moveMarker()

_editDeletWorkout(e) {
    const clickWorkout = e.target.closest('.workout'); //still need to know the object details
    const clickedBtn = e.target.closest('.xedit__btn'); //to check which button is pressed

                              if (!clickedBtn) return; //guard clause

    const id = clickWorkout.dataset.id; //id to connect click and workout object
    const correspondingWorkout = this.#workouts.find(item => item.id === id) 
    const indexOfCorrespondingWorkout = this.#workouts.indexOf(correspondingWorkout) //find index to delete


    
//WHEN PRESSING "Delete"
  if (clickedBtn.classList.contains('delete--btn')) { 
      clickWorkout.remove(); //remove HTML element
      this.#workouts.splice(indexOfCorrespondingWorkout, 1); //deleting the corresponding workout
      console.log(this.#workouts);
      this._setLocalStorage(); //set Local Storage 
      
      //NOTE: for the moment i have to reload to remove map marker

    }

//WHEN PRESSING "Edit"  
  if (clickedBtn.classList.contains('edit--btn')) { 
    this._showForm();
    
  //fill form fields with actual workout values
  this._setFormFields(
    correspondingWorkout.distance,
    correspondingWorkout.duration,
    correspondingWorkout.cadence,
    correspondingWorkout.elevationGain
  );

  //constant to recreate the object
    //functions to check inserted data
    const validInput = (...inputs) => inputs.every(inp => Number.isFinite(inp));
    const positiveInput = (...inputs) => inputs.every(inp => inp > 0);
  
    //GET THE SELECTED OBJECT DATA FROM THE FORM
    const type = correspondingWorkout.type; //from the selected object
    const distance = +inputDistance.value; 
    const duration = +inputDuration.value;

        if (type === 'running') { //if i chose to edit a running object
      inputType.value = 'running'; //set the activity tipe in the activity selector
      inputElevation.closest('.form__row').classList.add('form__row--hidden'); //show only "Cadence"
      inputCadence.closest('.form__row').classList.remove('form__row--hidden'); 
    }

      if (type === 'cycling') {
      console.log('ciao');
      inputType.value = 'cycling'; //set the activity tipe in the activity selector
      inputCadence.closest('.form__row').classList.add('form__row--hidden'); //show only "Elevation Gain"
      inputElevation.closest('.form__row').classList.remove('form__row--hidden'); 
    }


  //remove form event listener to avoid submit new workout, re-add to edit the selected workout
  form.removeEventListener('submit', this.clickFormHandlerNewWorkout); //remove event handler
  form.addEventListener('submit', function(e) { //immediately add a new event listener for the edit form
    e.preventDefault();

 //Edit the properties values in the selected workout object inside #workouts array
    this.#workouts[indexOfCorrespondingWorkout].distance = distance;
    this.#workouts[indexOfCorrespondingWorkout].duration = duration;

    
    if (type === 'running') { //if i chose to edit a running object
      // inputType.value = 'running'; //set the activity tipe in the activity selector
      // inputElevation.closest('.form__row').classList.add('form__row--hidden'); //show only "Cadence"
      // inputCadence.closest('.form__row').classList.remove('form__row--hidden');
  //Edit also the cadence property, which is only for Running
      const cadence = +inputCadence.value;
      this.#workouts[indexOfCorrespondingWorkout].cadence = cadence;


    };

    if (type === 'cycling') {
      // inputType.value = 'cycling'; //set the activity tipe in the activity selector
      // inputCadence.closest('.form__row').classList.add('form__row--hidden'); //show only "Elevation Gain"
      // inputElevation.closest('.form__row').classList.remove('form__row--hidden'); 
    };

    // this._hideForm(); //call the method to hide the form after submitting new workout
    console.log(this.#workouts);
    // this._setLocalStorage('reload'); //store #workouts array to the Local Storage after submitting new one
    }.bind(this)) //END EVENT LISTENER ON EDIT FORM
  };

  }
//-------------------------------------------------------------------------END OF _editDeletWorkout()

  _setLocalStorage(reload) { //pass an argument to also reload page
    localStorage.setItem('workouts', JSON.stringify(this.#workouts))
    if (reload === 'reload') location.reload(); //reload the page also
  }
//---------------------------------------------------------------------------END OF _setLocalStorage()
 _getLocalStorage() {
    const localStorageData = JSON.parse(localStorage.getItem('workouts'));

    if(!localStorageData) return; //guard clause, if Local Storage is empty, just return

    this.#workouts = localStorageData; //restore #workouts array
    this.#workouts.forEach(it => this._renderWorkout(it)); //loop and restore LIST
    //to restore MARKERS, i have to write the code after leaflet map object is created
  }
//---------------------------------------------------------------------------END OF _getLocalStorage()
  _resetWorkouts() {
      localStorage.removeItem('workouts')
      location.reload(); //location object is a big browser object
  }
//---------------------------------------------------------------------------END OF _resetWorkouts()

} //-----------------------------------------------------------------------------END OF App class

//creating the object form App class
const appMappa = new App();