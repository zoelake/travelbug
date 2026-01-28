import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import Lottie from "react-lottie"
import styles from "../styles/Home.module.css";
import stringChecker from "../utils/stringChecker";
import Card from "../comps/Card";
import globeAnimation from '../public/lottie/globe.json'
import GA from "../utils/analytics";

export default function Home() {
  const [newPrompt, setNewPrompt] = useState("");
  const [result, setResult] = useState([]);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const resultsRef = useRef(null);

  //checks & loads past prompts/recommendations from localStorage
  useEffect(() => {
    const localData = localStorage.getItem('results');
    if (localData) {
      const userData = JSON.parse(localData);
      setResult(userData);
    }
  }, []);

  const scrollToResultsTop = () => {
    if (resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  async function onSubmit(event) {
    event.preventDefault();

    // forces the user to write something
    if (newPrompt.length > 5) {
      setLoading(true);

      try {
        const response = await fetch("/api/openAI", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ idea: newPrompt }),
        });

        if (response.ok) {
          const data = await response.json();
          const prompt = data.prompt;
          const place = data.result;

          // triggers localStorage to save/update new prompt/response
          setReady(true);

          // checks for empty strings from api then set response
          const checker = stringChecker(place);
          if (checker) {
            setResult((prev) => [...prev, { prompt, checker }]);
          } else {
            setResult((prev) => [...prev, { prompt, place }]);
          }

          scrollToResultsTop();

          setNewPrompt("");
          return;
          
        } else if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");

          let message = null;
          try {
            message = await response.json();
          } catch {}

          alert(
            `${message?.error || "Too many requests."}${
              retryAfter ? ` Please try again in ${retryAfter} seconds.` : ""
            }`
          );
        } else if (response.status === 401) {
          alert(`Looks like I'm out of credits today so you're out of luck... sorry!`);
        } else {
          let payload = null;
          try {
            payload = await response.json();
          } catch {}

          const msg =
            payload?.error ||
            payload?.message ||
            "Something went wrong. Please try again.";

          throw new Error(msg);
        }
      } catch (error) {
        alert(`Error: ${error?.message || "Something went wrong. Please try again."}`);
      } finally {
        setLoading(false);
      }

    } else {
      alert("Please type more!");
    }
  }

  // triggered localStorage to save/update new prompt/response
  useEffect(() => {
    ready ? localStorage.setItem('results', JSON.stringify(result)) : null;
  }, [result]);

    const lottieOptions = {
    loop: true,
    autoplay: true,
    animationData: globeAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice"
    }
  };


  return (
    <div>
      <Head>
        <title>Travel Bug</title>
        <link rel="icon" href="/globe.png" />
        <meta name="description" content="Describe a trip, get a location. Sit back and let AI do the brainstorming!"></meta>
        <meta name="author" content="Zoë James"></meta>
        <meta charset="utf-8"></meta>
        {GA.enabled ? (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA.id}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA.id}', { anonymize_ip: true });
                `,
              }}
            />
          </>
        ) : (
          process.env.NODE_ENV === "production" && (
            <script
              dangerouslySetInnerHTML={{
                __html: "console.warn('Google Analytics disabled: missing NEXT_PUBLIC_GA_ID')",
              }}
            />
          )
        )}
      </Head>

      <main className={styles.main}>
        <div className="splineCont">
          {globeAnimation && <Lottie
            options={lottieOptions}
            height={300}
            width={300}
          />}
        </div>
        <h1>Travel Bug</h1>
        <h2>Describe a trip, get a location<br></br>Sit back and let AI do the brainstorming!</h2>
        <form onSubmit={onSubmit}>
          <input
            type="text"
            // name="animal"
            placeholder="I want to go somewhere..."
            value={newPrompt}
            onChange={(e) => setNewPrompt(e.target.value)}
          />
          <input type="submit" value={loading ? "Loading..." :`Generate destination`} disabled={loading} />
        </form>
        <div className={styles.result} ref={resultsRef}>
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
