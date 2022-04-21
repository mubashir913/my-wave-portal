import React, {useEffect, useState} from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/WavePortal.json";
import Spin from "./Comps/Spin";

function App() {

  const [screenWidth, setScreenWidth] = useState(() => window.innerWidth);
  const [accounts, setAccounts] = useState(null);
  const [walletChecked, setWalletChecked] = useState(false);
  const [waving, setWaving] = useState(false);
  const [allWaves, setAllWaves] = useState([]);
  const [msg, setMsg] = useState("");
  
  const contractAddress = "0xd89AFe7eF0586acFcBeAE46Ab259Bf53DB6d851b";
  const contractABI = abi.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) return;
      const accs = await ethereum.request({ method: "eth_accounts" });
      if (accs.length === 0) return;
      
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      const waves = await wavePortalContract.getAllWaves();

      let wavesCleaned = [];
      
      waves.forEach(wave => {
        wavesCleaned.push({
          address: wave.waver,
          dateObj: new Date(wave.timestamp * 1000),
          time: getTime(new Date(wave.timestamp * 1000)),
          message: wave.message
        });
      });
      
      setAllWaves(wavesCleaned.reverse());
      
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async () => {
    if (waving) return;
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setWaving(false);
        alert("No Wallet Detected.");
        return;
      }
      
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length === 0) {
        setWaving(false);
        alert("Please Connect Your Wallet.");
        return;
      }

      if (msg.trim().length === 0) {
        setWaving(false);
        alert("Type something in the message bar.");
        return;
      }

      setWaving(true);
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

      // What this does is make the user pay a set amount of gas of 300,000. And, if they don't use all of it in the transaction they'll automatically be refunded.
      wavePortalContract.wave(msg.replace(/\s\s+/g, ' '), {gasLimit: 300000})
      .then((tx) => {
        //action prior to transaction being mined
        provider.waitForTransaction(tx.hash)
        .then(()=>{
           //action after transaction is mined
          setMsg("");
          setWaving(false);
        })
      })
      .catch(() => {
        //action to perform when user clicks "reject"
        setWaving(false);
      })
        
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        setWalletChecked(true);
        return;
      };

      const accs = await ethereum.request({ method: "eth_accounts" });

      if (accs.length !== 0) {
        setAccounts(accs);
        await getAllWaves();
      }
      setWalletChecked(true);
      
    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("No Wallet Detected.");
        return;
      }

      const accs = await ethereum.request({ method: "eth_requestAccounts" });
      
      if (accs.length !== 0) {
        setAccounts(accs);
        await getAllWaves();
      }
      
    } catch (error) {
      console.log(error)
    }
  }

  const getMonth = (month_num) => {
    let month;
    switch (month_num) {
      case 0:
        month = "January";
        break;
      case 1:
        month = "February";
        break;
      case 2:
        month = "March";
        break;
      case 3:
        month = "April";
        break;
      case 4:
        month = "May";
        break;
      case 5:
        month = "June";
        break;
      case 6:
        month = "July";
        break;
      case 7:
        month = "August";
        break;
      case 8:
        month = "September";
        break;
      case 9:
        month = "October";
        break;
      case 10:
        month = "November";
        break;
      case 11:
        month = "December";
        break;
      default:
        break;
    }
    return month;
  }

  const getDateSuff = (date) => {
    let dateSuffix;
    switch (date.toString()[date.toString().length-1]) {
      case "1":
        dateSuffix = "st";
        break;
      case "2":
        dateSuffix = "nd";
        break;
      case "3":
        dateSuffix = "rd";
        break;
      default:
        dateSuffix = "th";
        break;
    }
    return dateSuffix;
  }

  const getTime = (date) => {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let sec = date.getSeconds();
    let ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    let strTime = hours + ':' + minutes + ':' + sec + ' ' + ampm;
    return strTime;
  }

  const resizeHandler = () => {
    setScreenWidth(() => window.innerWidth);
  }
  
  useEffect(() => {
    checkIfWalletIsConnected();
    let wavePortalContract;
    const onNewWave = (from, timestamp, message) => {
      setAllWaves(prevState => [
        {
          address: from,
          dateObj: new Date(timestamp * 1000),
          time: getTime(new Date(timestamp * 1000)),
          message: message
        },
        ...prevState
      ]);
    };
  
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
  
      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on("NewWave", onNewWave);
    }
    
    window.addEventListener("resize", resizeHandler);
    
    return () => {
      window.removeEventListener("resize", resizeHandler);
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    }
  }, []);
  
  return (
    <>
      <header>
        <div> Wave Portal </div>
        {walletChecked ? accounts === null ?
        <button onClick={connectWallet}> Connect Wallet </button> : null :
        <button style={{width: screenWidth > 1400 ? "12vw" : screenWidth > 600 ? "150px" : "120px"}}>
          <Spin size={screenWidth > 1400 ? "1.25vw" : "12px"} color="blueviolet" />
        </button>}
      </header>
      <section className="welcome-sec">
        <div className="welcome-txt-1"> Welcome to my Wave Portal 👋 </div>
        <div className="welcome-txt-2"> Hi, I am Muhammad Mubashir. I built this Web3 App following <a href="https://app.buildspace.so/projects/CO02cf0f1c-f996-4f50-9669-cf945ca3fb0b" target="_blank" rel="noopener noreferrer">this</a> project on <a href="https://buildspace.so/" target="_blank" rel="noopener noreferrer">buildspace</a>. Don't forget to wave at me :) </div>
        <textarea value={msg} onChange={e => !waving && setMsg(e.target.value)} placeholder="Type a Message" />
        {waving ?
        <button style={{backgroundColor: "#ba78f7", cursor: "not-allowed"}}>
          <Spin size={screenWidth > 1400 ? "1.25vw" : "15px"} color="white" />
        </button>
        : <button onClick={wave}> Wave </button>}
      </section>
      {walletChecked ? accounts === null ? null :
      <div className="waves-heading"> All Waves </div> : null}
      <section className="data-sec">
        {allWaves.map((wave, index) => {
          return (
            <div key={index} className="wave-data-div">
              <div>
                <a href={`https://rinkeby.etherscan.io/address/${wave.address}`} target="_blank" rel="noopener noreferrer">{wave.address}</a> waved at me on <span style={{fontWeight: 600}}>{wave.dateObj.getDate().toString()}<sup>{getDateSuff(wave.dateObj.getDate())}</sup> {getMonth(wave.dateObj.getMonth())}, {wave.dateObj.getFullYear().toString()}</span> at <span style={{fontWeight: 600}}>{wave.time.toString()}</span> with the message:
              </div>
              <div className="data-msg"> {wave.message} </div>
            </div>
          )
        })}
      </section>
    </>
  );
}

export default App;
