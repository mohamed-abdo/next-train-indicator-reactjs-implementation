/* 
 Developed By: Mohamed Abdo - Mohamad.Abdo@gmail.com
 Modified  On: 2017-07-10
 Purpose:  Next train indicator problem sample code in react js.
*/ 
// start utilties
let utilities= function(){

		let setInitialTime= function(hours){
			let startDate= new Date().setHours(hours);
		  	startDate= new Date(startDate).setMinutes(0);
			return new Date(new Date(startDate).setSeconds(0));
		}

		let addMinutes= function(dateOffset, minutes){
			return new Date(dateOffset.getTime() + (minutes * (1000 * 60)))
		}

		let dTDiffInDays= function(startDate, endDate){
        return Math.round((endDate - startDate)/(1000*60*60*24));
		}

		let dTDiffInMins= function(startDate, endDate){
			return Math.round((endDate - startDate)/(1000*60));
		}

	return { setInitialTime, dTDiffInDays, dTDiffInMins, addMinutes };
}
let utilitiesFactory=new utilities();
// end utilities
//start train engine api
let train =function(name, predicate){
    let checkArrivalTime= function(dateTime){
    if(predicate(dateTime))
        return true;
    return false;
    }   
    return {
        checkArrivalTime, name
    };
};

let trainSchedulerEngine=function(trains){
	let trainsFunctor=[...trains];

    let registerTrains =function(trains){
        //TODO: validate that train by name, is not already exists.
        return trains.map(train=>{
            trainsFunctor.push(train);
        });
    };


    let generateTrainSchedule= function(train, startDate, endDate){
            // validate that date difference is maximum one day, else we should in think in different scale 
            if(utilitiesFactory.dTDiffInDays(startDate, endDate) > 1)
                throw "not supported";
            let initialDate=startDate;
            let trainsSchedule=[];
            while(initialDate <= endDate){
                if(train.checkArrivalTime(initialDate))
                   trainsSchedule.push({'train': train.name, 'expectedArrivalDate':initialDate,  'minutesToArrive': (utilitiesFactory.dTDiffInMins(startDate, initialDate))});
                initialDate=new Date(initialDate.getTime() + (1 * (1000 * 60)))
            }
            return trainsSchedule;
    };

    let getTrainScheduleBetweenDates =  function(startDate, endDate){
            return trainsFunctor.map((train)=> {
                return generateTrainSchedule(train, startDate, endDate);        
            });
    }
	return {registerTrains, getTrainScheduleBetweenDates}
};

let trains=[ 
    new train('Central Station', (dateTime)=>{
    // this train run every 20 minutes, no exception for certain dates
    return dateTime.getMinutes() % 20 == 0;
}) ,new train('Circular', (dateTime)=> {
        // this train run every 60 minutes, no exception for certain dates
          return dateTime.getMinutes() == 0;
}) ,new train('North Square', (dateTime)=> {
        // this train run every 12 minutes from 07:00 until 22:00, no exception for certain dates
          return (dateTime.getHours() >=7 &&
                 dateTime.getHours() <=22 &&
                 dateTime.getMinutes() % 12 ==0);
}) ,new train('West Market', (dateTime)=> {
        // this train run every 6 minutes from 05:30 until 01:30, no exception for certain dates
          return ((dateTime.getHours() + dateTime.getMinutes() >= 35)  &&
                 (dateTime.getHours() + dateTime.getMinutes() <= 31)  &&
                 dateTime.getMinutes() % 6 ==0);
})]
// end train engine


// start header
class NTIHeader extends React.Component{
	constructor(props){
		super(props);
		this.title=props.title;
	}
	render(){
		return (<h1> {this.props.title} </h1>);
	}
}
// end header

// start scheduler component
class ScheduledTrainTable extends React.Component{
	constructor(props){
		super(props);
		// initiate state, and any default values.
		this.initialSetHours=props.initialSetHours;
		this.schedulerMinutes=props.schedulerMinutes;
		this.pageSize=props.pageSize;
		// state initialize
		this.state={data:[], startSchedulerDate: this.setInitialTime(this.initialSetHours)}
	}
	
	// render event, bind clock to each (x) seconds timer as virtial timer scheduler, to update the view, and bring new schedule
	componentDidMount() {
		this.schedulerTick(); //only for first time rendering.
    	this.timerId=setInterval(()=> this.schedulerTick(), (1000 * 5));					 
  	}
	
	// release resources
	componentWillUnmount() {
		clearInterval(this.timerId);
	}

	setInitialTime(hours){
			let startDate= new Date().setHours(hours);
		  	startDate= new Date(startDate).setMinutes(0);
			return new Date(new Date(startDate).setSeconds(0));
	}

	addMinutes(dateOffset, minutes){
			return new Date(dateOffset.getTime() + (minutes * (1000 * 60)))
	}

	// update state
	schedulerTick(){
		let engine= new trainSchedulerEngine(trains);
		let endSchedulerDate=this.addMinutes(this.state.startSchedulerDate, 15);
		endSchedulerDate= new Date(endSchedulerDate).setSeconds(0);
		//transform data
		let rawData= engine.getTrainScheduleBetweenDates(new Date(this.state.startSchedulerDate), new Date(endSchedulerDate));
		let flattenData= rawData.reduce((a,b)=> {return a.concat(b);} );
		let sortedData = flattenData.sort((a,b)=> {return a.expectedArrivalDate - b.expectedArrivalDate;});
		// show pages each interval (3 seconds)
		let pagedData= sortedData.slice(0, this.pageSize).map((v,i) => {
					return {
						'station': v.train, 'expectedArrivalDate':v.expectedArrivalDate, 'minutesToArrive':v.minutesToArrive
					}});
		// TODO: I need to implement auto cycle pager:
	  // let chunks= new Array(Math.ceil(pagedData.length / this.pageSize)).fill().map(_ => pagedData.splice(0,this.pageSize));
		this.setState((prevState, props) => {
		return { data:pagedData, startSchedulerDate: this.addMinutes(prevState.startSchedulerDate, this.schedulerMinutes)};
		});
	}
	render(){
		return  (
			<ul>
				{	this.state.data.map((value, idx)=>	<li> <h4>  {idx+1} -   {value.station} -  {value.minutesToArrive + ' min'} </h4> </li>)	}
			</ul>
					);
	}
}
// end scheduler

// start clock component
class Clock extends React.Component{
	constructor(props){
		super(props);
		// initiate state, and any default values.
	  	let startDate= new Date().setHours(props.initialSetTime);
	  	startDate= new Date(startDate).setMinutes(0);
		startDate= new Date(startDate).setSeconds(0);
		this.state={localTime: new Date(startDate)};
	}
	
	// render event, bind clock to each second timer
	componentDidMount() {
    this.timerId=setInterval(()=> this.tick(), 1000);
  	}
	
	// release resources
	componentWillUnmount() {
		clearInterval(this.timerId);
	}
	
	// update state
	tick(){
		this.setState((preState) =>({localTime: new Date( (new Date(preState.localTime).getTime() + (1000 * 60)) )}));
	}
	render(){
		return (<h5> {this.state.localTime.toLocaleTimeString()} </h5>);
	}
}
// end clock

// NTI main component
class NTIComponent extends React.Component{
	constructor(props){
		super(props);
	}
	render(){
		return (
			<div>
				 <div id="NTI-compoent">
						<header>
							<NTIHeader title={"Next Train Indicator"}/>
						</header>

						<section>
					   <ScheduledTrainTable initialSetHours={5} schedulerMinutes={15} pageSize={3}  />
						</section>

						<footer>
						 <Clock initialSetTime={5}/>
						</footer>
				 </div> 
			</div>
		);
	}
}
// end NTI
class App extends React.Component{
	constructor(props){
		super(props);
	}
	render(){
		return (<NTIComponent />);
	}
}
// render app
const rootElement=document.getElementById('root');
ReactDOM.render(<App />, rootElement);
