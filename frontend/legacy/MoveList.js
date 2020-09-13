//React Imports
import React from "react"
import { useParams } from 'react-router-dom';

//Component Imports
import Move from './Move'
//import SortBy from './SortBy'

//CSS Imports
import '../css/MoveList.css';

//Set hostname to query depending on dev vs PROD
const environment = process.env.NODE_ENV === "development" ? "localhost" : "ultimate-hitboxes.com";

function MoveList(props) {

	//Get the character from the URL
	let character = useParams().character

	//If chararacter data doesn't exist, query the backend server
	if (props.characterListData === undefined) {
		return null;
	}
	else if (props.currentCharacterData === undefined || props.currentCharacterData.value !== character) {
		//get the characters number by searching characterData
		let characterFromCharacterData = props.characterListData.filter(obj => {
			return obj.value === character
		})

		//API call to the backend to get character data
		fetch(`http://${environment}:5000/${characterFromCharacterData[0].number}_${character}/data`)
			.then(response => response.json())
			.then(data => {
				props.updateCurrentCharacter(data)
			})
			//TODO: MAKE ERROR HANDLING MORE ROBUST
			.catch(err => {
				console.log(err)
			})
		return null;
	}
	else {
		let moveButtonArray = []

		moveButtonArray = props.currentCharacterData.moves.map(move => <Move key={move.value} settings={props.settings.dark_light} move={move}/>)
		return (

			<div id="moveList">
				<h3>Choose a Move</h3>


				{moveButtonArray}
			</div>
		)
	}
		//if (!props.cookieSet) {
		//	props.changeSettings()
		//}

		////Create a deep copy of the settings
		//let settings = JSON.parse(JSON.stringify(props.settings));
			
		//let sortedCharacterData = []

		////Sort Characters based on the criteria in the sortBy Field
		//sortedCharacterData = props.characterListData.slice().sort((a, b) => (a[props.settings.sortBy] > b[props.settings.sortBy]) ? 1 : -1)

		////Filter the results based on the searchBar
		//sortedCharacterData = sortedCharacterData.filter(obj => { return obj.name.toUpperCase().includes(props.search.toUpperCase()) })

		////Create icons based on the constraints above
		//let moveButtonArray = []
		//moveButtonArray = props.updateCurrentCharacter.moves.map(character => <Character key={character.id} dark_light={props.settings.dark_light} character={character} getCharacterData={props.getCharacterData} />)

		

			

		
	//<form>
	//	<input id="searchbar" type="text" value={props.search} placeholder="Search for a Character" onChange={props.changeSearchValue} ></input>

	//	<SortBy changeSettings={props.changeSettings} settings={settings} />

	//</form>
}


export default MoveList