import { FiExternalLink } from "react-icons/fi";

function Card({
    prompt = 'my prompt',
    place = 'location'
}) {

    return (
        <div className='card'>
            {/* load google maps location based on location generated */}
            {/* place.length to handle api returning empty */}
            {(place.length > 5) && (place.length < 20) ? <a href={`https://www.google.com/maps/place/${place}`} target="_blank">
                <FiExternalLink
                    size={30}
                    id='card__icon'
                    alt="external link icon" />
            </a> : <></>}
            <p>I want to go somewhere...</p>
            <p className="card__textPrompt">{prompt}</p>

            {(place.length > 5) && (place.length < 20) ? <>
                <p>Travel Bot recommends...</p>
                <a href={`https://www.google.com/maps/place/${place}`} target="_blank">
                    <p id='card__textResult'>{place}</p>
                </a>
            </> : <>
                <p>Travel Bot couldn't think of anything...</p>
                <p id='card__textResult'>Please, try again.</p>
            </>}

        </div>
    )
};

export default Card;