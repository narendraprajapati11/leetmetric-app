document.addEventListener("DOMContentLoaded", function() {
    const searchButton = document.getElementById("search-btn");
    const usernameInput = document.getElementById("user-input");
    const statsContainer = document.querySelector(".stats-container");
    const easyProgressCircle = document.querySelector(".easy-progress");
    const mediumProgressCircle = document.querySelector(".medium-progress");
    const hardProgressCircle = document.querySelector(".hard-progress");
    const easyLabel = document.getElementById("easy-label");
    const mediumLabel = document.getElementById("medium-label");
    const hardLabel = document.getElementById("hard-label");
    const cardStatsContainer = document.querySelector(".stats-cards");

    // return true or false based on a regex
    function validateUsername(username) {
        if (username.trim() === "") {
            alert("Username should not be empty");
            return false;
        }
        const regex = /^[a-zA-Z0-9_-]{1,15}$/;
        const isMatching = regex.test(username);
        if (!isMatching) {
            alert("Invalid Username. Use only letters, numbers, underscores, or hyphens (1-15 characters).");
        }
        return isMatching;
    }

    async function fetchUserDetails(username) {
        try {
            searchButton.textContent = "Searching...";
            searchButton.disabled = true;
            statsContainer.innerHTML = '<p>Loading user data...</p>'; // Show loading message

            // IMPORTANT: Replace 'YOUR_DEPLOYED_PROXY_URL_HERE' with your actual proxy URL
            // If running locally, it might be 'http://localhost:3000/graphql-proxy'
            const proxyUrl = 'YOUR_DEPLOYED_PROXY_URL_HERE/graphql-proxy'; // Or your local proxy if not deployed

            const myHeaders = new Headers();
            myHeaders.append("Content-Type", "application/json");

            const graphql = {
                query: `
                    query userSessionProgress($username: String!) {
                        allQuestionsCount {
                            difficulty
                            count
                        }
                        matchedUser(username: $username) {
                            submitStats {
                                acSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                                totalSubmissionNum {
                                    difficulty
                                    count
                                    submissions
                                }
                            }
                        }
                    }
                `,
                variables: {
                    "username": username
                }
            };

            const requestOptions = {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify(graphql),
            };

            const response = await fetch(proxyUrl, requestOptions);

            if (!response.ok) {
                let errorText = `Network response was not ok (Status: ${response.status})`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorText = errorData.message;
                    }
                } catch (e) {
                    // response body might not be JSON
                }
                throw new Error(errorText);
            }

            const parsedData = await response.json();
            console.log("LeetCode API Response:", parsedData);

            // Check for errors returned by the LeetCode GraphQL API itself
            if (parsedData.errors && parsedData.errors.length > 0) {
                const errorMessage = parsedData.errors.map(err => err.message).join("; ");
                throw new Error(`LeetCode API Error: ${errorMessage}`);
            }

            if (!parsedData.data || !parsedData.data.matchedUser) {
                // Handle cases where user is not found or no data is returned for the user
                statsContainer.innerHTML = '<p>User not found or no data available for this username.</p>';
                return;
            }

            displayUserData(parsedData);
        } catch (error) {
            console.error("Error fetching user details:", error);
            statsContainer.innerHTML = `<p>Error: ${error.message}. Please try again.</p>`;
        } finally {
            searchButton.textContent = "Search";
            searchButton.disabled = false;
        }
    }

    function updateProgress(solved, total, labelElement, circleElement) {
        // Ensure total is not zero to prevent division by zero
        const progressPercentage = total > 0 ? (solved / total) * 100 : 0;
        const progressDegrees = (progressPercentage / 100) * 360; // Convert to degrees

        circleElement.style.setProperty("--progress-degree", `${progressDegrees}deg`);
        labelElement.textContent = `${solved}/${total}`;
    }

    function displayUserData(parsedData) {
        // Assuming the order of difficulties is consistent: Total, Easy, Medium, Hard
        const allQuestions = parsedData.data.allQuestionsCount;
        const submitStats = parsedData.data.matchedUser.submitStats;

        const totalEasyQues = allQuestions.find(q => q.difficulty === "Easy")?.count || 0;
        const totalMediumQues = allQuestions.find(q => q.difficulty === "Medium")?.count || 0;
        const totalHardQues = allQuestions.find(q => q.difficulty === "Hard")?.count || 0;

        const solvedEasyQues = submitStats.acSubmissionNum.find(s => s.difficulty === "Easy")?.count || 0;
        const solvedMediumQues = submitStats.acSubmissionNum.find(s => s.difficulty === "Medium")?.count || 0;
        const solvedHardQues = submitStats.acSubmissionNum.find(s => s.difficulty === "Hard")?.count || 0;

        // Update the progress circles
        updateProgress(solvedEasyQues, totalEasyQues, easyLabel, easyProgressCircle);
        updateProgress(solvedMediumQues, totalMediumQues, mediumLabel, mediumProgressCircle);
        updateProgress(solvedHardQues, totalHardQues, hardLabel, hardProgressCircle);

        // Prepare data for stats cards
        const overallSubmissions = submitStats.totalSubmissionNum.find(s => s.difficulty === "All")?.submissions || 0;
        const easySubmissions = submitStats.totalSubmissionNum.find(s => s.difficulty === "Easy")?.submissions || 0;
        const mediumSubmissions = submitStats.totalSubmissionNum.find(s => s.difficulty === "Medium")?.submissions || 0;
        const hardSubmissions = submitStats.totalSubmissionNum.find(s => s.difficulty === "Hard")?.submissions || 0;

        const cardsData = [
            { label: "Overall Solved", value: solvedEasyQues + solvedMediumQues + solvedHardQues + "/" + (totalEasyQues + totalMediumQues + totalHardQues)},
            { label: "Total Submissions", value: overallSubmissions },
            { label: "Easy Submissions", value: easySubmissions },
            { label: "Medium Submissions", value: mediumSubmissions },
            { label: "Hard Submissions", value: hardSubmissions },
        ];

        console.log("Card Data:", cardsData);

        cardStatsContainer.innerHTML = cardsData.map(
            data =>
            `<div class="card">
                <h4>${data.label}</h4>
                <p>${data.value}</p>
            </div>`
        ).join("");
        statsContainer.classList.remove("hidden"); // Ensure stats are visible after loading
    }

    searchButton.addEventListener('click', function() {
        const username = usernameInput.value;
        console.log("Searching for username:", username);
        if (validateUsername(username)) {
            fetchUserDetails(username);
        }
    });
});