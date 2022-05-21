import Head from "next/head";
import { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import stringChecker from "../utils/stringChecker";
import Card from "../comps/Card";
import Spline from '@splinetool/react-spline';

export default function Home() {
  const [newPrompt, setNewPrompt] = useState("");
  const [result, setResult] = useState([]);
  const [ready, setReady] = useState(false);

  //checks & loads past prompts/recommendations from localStorage
  useEffect(() => {
    const localData = localStorage.getItem('results');
    if (localData) {
      const userData = JSON.parse(localData);
      setResult(userData);
    }
  }, []);

  async function onSubmit(event) {
    event.preventDefault();

    //forces the user to write something
    if (newPrompt.length > 5) {
      const response = await fetch("/api/openAI", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea: newPrompt }),
      });
      const data = await response.json();
      const prompt = data.prompt;
      const place = data.result;

      //triggers localStorage to save/update new prompt/response
      setReady(true);

      //checks for empty strings from api then set response
      const checker = stringChecker(place);
      if (checker) {
        setResult(prev => [
          ...prev,
          { prompt, checker }
        ]);
      } else {
        setResult(prev => [
          ...prev,
          { prompt, place }
        ]);
      }
    } else {
      alert('Please type more!')
    }
    //reset input
    setNewPrompt("");
  }

  // triggered localStorage to save/update new prompt/response
  useEffect(() => {
    ready ? localStorage.setItem('results', JSON.stringify(result)) : null;
  }, [result]);


  return (
    <div>
      <Head>
        <title>Travel Bug</title>
        <link rel="icon" href="/globe.png" />
        <meta name="description" content="Describe a trip, get a location. Sit back and let AI do the brainstorming!"></meta>
        <meta name="author" content="Zoë James"></meta>
        <meta charset="utf-8"></meta>
      </Head>

      <main className={styles.main}>
        <div className="splineCont">
          <Spline scene="https://prod.spline.design/oYIALHWyxgsEpJko/scene.splinecode" alt='spinning animated globe ' />
        </div>
        <h1>Travel Bug</h1>
        <h2>Describe a trip, get a location<br></br>Sit back and let AI do the brainstorming!</h2>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            name="animal"
            placeholder="I want to go somewhere..."
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
          />
          <input type="submit" value="Generate destination" />
        </form>
        <div className={styles.result}>
          {result ? result.map(({ prompt, place }, i) => <Card
            key={i}
            place={place}
            prompt={prompt}
          />) : <></>}

        </div>

      </main>
      <footer>
        <a href="https://zoejames.codes" target="_blank">
          zoejames.codes
        </a>
      </footer>
    </div>
  );
}
