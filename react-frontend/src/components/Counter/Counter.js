import React, {
    useEffect,
    useState
} from 'react';


const Counter = ({ }) => {

    const countingApi = "https://counter.carlo-hildebrandt.de"
    const increasePath = "/increase"

    const [currentCount, setCurrentCount] = useState(undefined)
    const [showHint, setShowHint] = useState(false)

    useEffect(() => {
        async function fetchCurrentCount() {
            const res = await fetch(countingApi)
            var data = await res.text()
            setCurrentCount(data)
        }
        fetchCurrentCount()
    }, []);

    useEffect(() => {
        setTimeout(async function () {
            const res = await fetch(countingApi + increasePath)
            var data = await res.text()
            setCurrentCount(data)
        }, 3000);
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setShowHint(false)
        }, 4000);
    }, []);

    useEffect(() => {
        setTimeout(() => {
            setShowHint(true)
        }, 2000);
    }, []);
    return (
        <>
            <p>
                Total amount of website visits:&thinsp;

                {(currentCount === undefined) &&
                    <>
                        loading...
                    </>
                }
                {(currentCount !== undefined) &&
                    <>
                        {currentCount}
                    </>
                }

                {(showHint) &&
                    <>
                        &thinsp;&thinsp;&thinsp;&lt;-- That is you
                    </>
                }
            </p>
        </>
    );

}

export default Counter;
