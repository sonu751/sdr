import { getDatabase, ref, push, update, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Initialize Firebase Database
const database = getDatabase();
const auth = getAuth();

function displayWelcomeMessage(user) {
    const welcomeContainer = document.getElementById('welcomeContainer');

    if (user) {
// Get current user's email
const currentUserEmail = user.email;
const welcomeMessage = document.createElement('p');
welcomeMessage.textContent = `Welcome, ${currentUserEmail}!`;
welcomeContainer.appendChild(welcomeMessage);

const userBalanceElement = document.getElementById('userbalance');
const ExpoElement = document.getElementById('Expo');
const userBalanceInputElement = document.getElementById('userbalancein');
const ExpoInputElement = document.getElementById('Expoin');
const teamalpInputElement = document.getElementById('teamalp');
const teamblpInputElement = document.getElementById('teamblp');

// Display placeholders for user data
userBalanceElement.textContent = `User Balance: loading...`;
ExpoElement.textContent = `Expo: loading...`;
userBalanceInputElement.value = `User Balance: loading...`;
ExpoInputElement.value = `Expo: loading...`;
teamalpInputElement.value = `Teamalp: loading...`;
teamblpInputElement.value = `Teamblp: loading...`;

// Reference to the current user's data in the database
const currentUserRef = ref(database, `users/${user.uid}`);

// Listen for changes in the current user's data
onValue(currentUserRef, (snapshot) => {
    const userData = snapshot.val();
    if (userData) {
        const userBalance = userData.Balance !== undefined ? userData.Balance : 0;
        const userExpo = userData.Expo !== undefined ? userData.Expo : 0;
        const teamalp = userData.teamalp !== undefined ? userData.teamalp : '000'; // Fetch teamalp data
        const teamblp = userData.teamblp !== undefined ? userData.teamblp : '000';

        userBalanceElement.textContent = `User Balance: ${userBalance}`;
        ExpoElement.textContent = `Expo: ${userExpo}`;
        userBalanceInputElement.value = `${userBalance}`;
        ExpoInputElement.value = `${userExpo}`;
        teamalpInputElement.value = `${teamalp}`;
        teamblpInputElement.value = `${teamblp}`;
    }
});

    } else {
        welcomeContainer.innerHTML = '<p>Please log in to see the welcome message.</p>';
    }
}


// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    displayWelcomeMessage(user);
});


/////////////////////////////////////////////////////

/////////////////////////////////////////////////////

function displaySells(snapshot) {
    const sellContainer = document.getElementById('sellContainer');
    sellContainer.innerHTML = ''; // Clear previous data

    snapshot.forEach((childSnapshot) => {
        const sellData = childSnapshot.val();

        // Create elements to display sell data
        const sellElement = document.createElement('div');
        sellElement.classList.add('sell-item'); // Add a class for styling if needed
        sellElement.innerHTML = `
        <div class="header-container">
        <p class="rate">Rate: ${sellData.rate || 'Undefined'}</p>
        <p class="quantity">Quantity: ${sellData.quantity || 'Undefined'}</p>
        <p class="profit">Profit: ${sellData.profit || 'Undefined'}</p>
        <p class="loss">Loss: ${sellData.loss || 'Undefined'}</p>
        <p class="seller">Seller: ${sellData.seller || 'Undefined'}</p>
        <p class="kya">kya: ${sellData.kya || 'Undefined'}</p>
        <p class="teamb">${sellData.teamb || ''}</p>
        <p class="teama">${sellData.teama || ''}</p>
    </div>
        `;

        // Log data before adding the button
        console.log("Sell Data:", sellData);

        // Append the sell element to the sell container
        sellContainer.appendChild(sellElement);

        // Create and add event listener to the appropriate button based on the values of kya and teama
        const buyButton = document.createElement('button');
        buyButton.classList.add('buy-button');
        if (sellData.kya === 'aapko lagana hai' && sellData.teama === 'TeamA') {
            buyButton.textContent = 'yes1';
            buyButton.addEventListener('click', () => {
                // Execute function for button no1
                handleBuyButtonClick(childSnapshot.key, sellData);
            });
        } else if (sellData.kya === 'aapko lagana hai' && sellData.teamb === 'TeamB') {
            buyButton.textContent = 'yes2';
            buyButton.addEventListener('click', () => {
                // Execute function for button no2
                handleBuyButtonClick2(childSnapshot.key, sellData);
            });
        } else if (sellData.kya === 'aapko khana hai?' && sellData.teama === 'TeamA') {
            buyButton.textContent = 'yes3';
            buyButton.addEventListener('click', () => {
                // Execute function for button no3
                handleBuyButtonClick3(childSnapshot.key, sellData);
            });
        } else if (sellData.kya === 'aapko khana hai?' && sellData.teamb === 'TeamB') {
            buyButton.textContent = 'yes4';
            buyButton.addEventListener('click', () => {
                // Execute function for button no4
                handleBuyButtonClick4(childSnapshot.key, sellData);
            });
        }
        buyButton.setAttribute('data-key', childSnapshot.key);

        // Append the buy button to the header container
        const headerContainer = sellElement.querySelector('.header-container');
        headerContainer.appendChild(buyButton);
    });
}


// Listen for changes in the "sells" node and display sells
onValue(ref(database, 'sells'), (snapshot) => {
    displaySells(snapshot);
});
/////////////////////////////////////////////////////////////

function handleBuyButtonClick(sellKey, sellData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("No user is currently logged in.");
        return;
    }

    const { email } = currentUser;

    // Reference to the user's node in the database
    const userRef = ref(database, `users/${currentUser.uid}`);

    // Fetch user data from the database
    get(userRef).then((userDataSnapshot) => {
        const userData = userDataSnapshot.val();

        // Ensure the user exists in the database
        if (!userData) {
            console.log("User data not found.");
            return;
        }

        const currentBalance = parseFloat(userData.Balance) || 0;
        const currentteamalp = parseFloat(userData.teamalp) || 0;
        const currentteamblp= parseFloat(userData.teamblp) || 0;

        // Calculate the total of Expo and user balance
        const totalBalanceteamblp = currentBalance + currentteamblp;

        // Check if the total of Expo and user balance is less than the seller data's profit value
        if (totalBalanceteamblp < parseFloat(sellData.loss)) {
            alert("Total of Expo and user balance is insufficient. Purchase cannot be completed.");
            return; // Stop further execution
        }

        // Calculate new Balance after the purchase
        let newBalance = currentBalance - parseFloat(sellData.loss); // Subtract sellData.profit from the balance

        // Calculate new Expo2 after the purchase
        let newteamalp = currentteamalp + parseFloat(sellData.profit)

        // Update the buy with buyer's email
        const buyRef = ref(database, `buys/${sellKey}`);
        set(buyRef, {
            ...sellData,
            buyer: email
        }).then(() => {
            console.log("Buy data updated successfully.");

            // Remove the sell from the sells collection
            const sellRef = ref(database, `sells/${sellKey}`);
            set(sellRef, null).then(() => {
                console.log("Sell moved to buys successfully.");

                // Update the user's Balance and Expo2 with the new values
                update(ref(database, `users/${currentUser.uid}`), {
                    Balance: newBalance,
                    teamalp: newteamalp
                }).then(() => {
                    console.log("User Balance and Expo2 updated successfully.");
                }).catch((error) => {
                    console.error("Error updating user Balance and Expo2:", error);
                });

            }).catch((error) => {
                console.error("Error moving sell to buys:", error);
            });
        }).catch((error) => {
            console.error("Error updating buy data:", error);
        });
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
}

function handleBuyButtonClick3(sellKey, sellData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("No user is currently logged in.");
        return;
    }

    const { email } = currentUser;

    // Reference to the user's node in the database
    const userRef = ref(database, `users/${currentUser.uid}`);

    // Fetch user data from the database
    get(userRef).then((userDataSnapshot) => {
        const userData = userDataSnapshot.val();

        // Ensure the user exists in the database
        if (!userData) {
            console.log("User data not found.");
            return;
        }

        const currentBalance = parseFloat(userData.Balance) || 0;
        const currentteamalp = parseFloat(userData.teamalp) || 0;
        const currentteamblp= parseFloat(userData.teamblp) || 0;

        // Calculate the total of Expo and user balance
        const totalBalanceteamalp = currentBalance + currentteamalp;

        // Check if the total of Expo and user balance is less than the seller data's profit value
        if (totalBalanceteamalp < parseFloat(sellData.loss)) {
            alert("Total of Expo and user balance is insufficient. Purchase cannot be completed.");
            return; // Stop further execution
        }

        // Calculate new Balance after the purchase
        let newBalance = currentBalance - parseFloat(sellData.loss); // Subtract sellData.profit from the balance

        // Calculate new Expo2 after the purchase
        let newteamblp = currentteamblp + parseFloat(sellData.profit)

        // Update the buy with buyer's email
        const buyRef = ref(database, `buys/${sellKey}`);
        set(buyRef, {
            ...sellData,
            buyer: email
        }).then(() => {
            console.log("Buy data updated successfully.");

            // Remove the sell from the sells collection
            const sellRef = ref(database, `sells/${sellKey}`);
            set(sellRef, null).then(() => {
                console.log("Sell moved to buys successfully.");

                // Update the user's Balance and Expo2 with the new values
                update(ref(database, `users/${currentUser.uid}`), {
                    Balance: newBalance,
                    teamblp: newteamblp
                }).then(() => {
                    console.log("User Balance and Expo2 updated successfully.");
                }).catch((error) => {
                    console.error("Error updating user Balance and Expo2:", error);
                });

            }).catch((error) => {
                console.error("Error moving sell to buys:", error);
            });
        }).catch((error) => {
            console.error("Error updating buy data:", error);
        });
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
}
////////////----------teamb2and4
function handleBuyButtonClick2(sellKey, sellData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("No user is currently logged in.");
        return;
    }

    const { email } = currentUser;

    // Reference to the user's node in the database
    const userRef = ref(database, `users/${currentUser.uid}`);

    // Fetch user data from the database
    get(userRef).then((userDataSnapshot) => {
        const userData = userDataSnapshot.val();

        // Ensure the user exists in the database
        if (!userData) {
            console.log("User data not found.");
            return;
        }

        const currentBalance = parseFloat(userData.Balance) || 0;
        const currentteamalp = parseFloat(userData.teamalp) || 0;
        const currentteamblp= parseFloat(userData.teamblp) || 0;

        // Calculate the total of Expo and user balance
        const totalBalanceteamalp = currentBalance + currentteamalp;

        // Check if the total of Expo and user balance is less than the seller data's profit value
        if (totalBalanceteamalp < parseFloat(sellData.loss)) {
            alert("Total of Expo and user balance is insufficient. Purchase cannot be completed.");
            return; // Stop further execution
        }

        // Calculate new Balance after the purchase
        let newBalance = currentBalance - parseFloat(sellData.loss); // Subtract sellData.profit from the balance

        // Calculate new Expo2 after the purchase
        let newteamblp = currentteamblp + parseFloat(sellData.profit)

        // Update the buy with buyer's email
        const buyRef = ref(database, `buys/${sellKey}`);
        set(buyRef, {
            ...sellData,
            buyer: email
        }).then(() => {
            console.log("Buy data updated successfully.");

            // Remove the sell from the sells collection
            const sellRef = ref(database, `sells/${sellKey}`);
            set(sellRef, null).then(() => {
                console.log("Sell moved to buys successfully.");

                // Update the user's Balance and Expo2 with the new values
                update(ref(database, `users/${currentUser.uid}`), {
                    Balance: newBalance,
                    teamblp: newteamblp
                }).then(() => {
                    console.log("User Balance and Expo2 updated successfully.");
                }).catch((error) => {
                    console.error("Error updating user Balance and Expo2:", error);
                });

            }).catch((error) => {
                console.error("Error moving sell to buys:", error);
            });
        }).catch((error) => {
            console.error("Error updating buy data:", error);
        });
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
}
function handleBuyButtonClick4(sellKey, sellData) {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        console.log("No user is currently logged in.");
        return;
    }

    const { email } = currentUser;

    // Reference to the user's node in the database
    const userRef = ref(database, `users/${currentUser.uid}`);

    // Fetch user data from the database
    get(userRef).then((userDataSnapshot) => {
        const userData = userDataSnapshot.val();

        // Ensure the user exists in the database
        if (!userData) {
            console.log("User data not found.");
            return;
        }

        const currentBalance = parseFloat(userData.Balance) || 0;
        const currentteamalp = parseFloat(userData.teamalp) || 0;
        const currentteamblp= parseFloat(userData.teamblp) || 0;

        // Calculate the total of Expo and user balance
        const totalBalanceteamblp = currentBalance + currentteamblp;

        // Check if the total of Expo and user balance is less than the seller data's profit value
        if (totalBalanceteamblp < parseFloat(sellData.loss)) {
            alert("Total of Expo and user balance is insufficient. Purchase cannot be completed.");
            return; // Stop further execution
        }

        // Calculate new Balance after the purchase
        let newBalance = currentBalance - parseFloat(sellData.loss); // Subtract sellData.profit from the balance

        // Calculate new Expo2 after the purchase
        let newteamalp = currentteamalp + parseFloat(sellData.profit)

        // Update the buy with buyer's email
        const buyRef = ref(database, `buys/${sellKey}`);
        set(buyRef, {
            ...sellData,
            buyer: email
        }).then(() => {
            console.log("Buy data updated successfully.");

            // Remove the sell from the sells collection
            const sellRef = ref(database, `sells/${sellKey}`);
            set(sellRef, null).then(() => {
                console.log("Sell moved to buys successfully.");

                // Update the user's Balance and Expo2 with the new values
                update(ref(database, `users/${currentUser.uid}`), {
                    Balance: newBalance,
                    teamalp: newteamalp
                }).then(() => {
                    console.log("User Balance and Expo2 updated successfully.");
                }).catch((error) => {
                    console.error("Error updating user Balance and Expo2:", error);
                });

            }).catch((error) => {
                console.error("Error moving sell to buys:", error);
            });
        }).catch((error) => {
            console.error("Error updating buy data:", error);
        });
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
}




/////////////////////////////////
function displayAllBuys(snapshot, currentUserEmail) {
    const buyContainer = document.getElementById('buyContainer');
    buyContainer.innerHTML = ''; // Clear previous data
    let totalLoss = 0; // Initialize total loss
    let totalProfit = 0; // Initialize total profit
    snapshot.forEach((childSnapshot) => {
        const buyData = childSnapshot.val();
        const buyKey = childSnapshot.key;

        if (buyData.buyer === currentUserEmail) {
            const buyElement = document.createElement('div');
            buyElement.innerHTML = `
                <p> ${buyData.teama || 'Undefined'}
                Rate: ${buyData.rate || 'Undefined'}
                Quantity: ${buyData.quantity || 'Undefined'}
                Profit: ${buyData.profit || 'Undefined'}
                buyer: ${buyData.buyer || 'Undefined'}
                Loss: ${buyData.loss || 'Undefined'}</p>
            `;

            buyContainer.appendChild(buyElement);
            totalLoss += parseFloat(buyData.loss) || 0;
            totalProfit += parseFloat(buyData.profit) || 0;
        }
    });

}

// Listen for changes in the buys node and display all buys where the current user is the buyer
auth.onAuthStateChanged((user) => {
    if (user) {
        const currentUserEmail = user.email;
        onValue(ref(database, 'buys'), (snapshot) => {
            displayAllBuys(snapshot, currentUserEmail);
        });
    }
});


// Listen for changes in the buys node and display all buys where the current user is the buyer
auth.onAuthStateChanged((user) => {
    if (user) {
        const currentUserEmail = user.email;
        onValue(ref(database, 'buys'), (snapshot) => {
            displayAllBuys(snapshot, currentUserEmail);
        });
    }
});

function displayUserBuys(snapshot, currentUserEmail) {
    const sellerContainer = document.getElementById('sellerContainer');
    sellerContainer.innerHTML = ''; // Clear previous data

    let totalLoss = 0;
    let totalProfit=0 // Initialize total loss

    snapshot.forEach((childSnapshot) => {
        const buyData = childSnapshot.val();
        const sellerEmail = buyData.seller;

        if (currentUserEmail === sellerEmail) {
            const buyElement = document.createElement('div');
            buyElement.innerHTML = `
            <p> ${buyData.teama || 'Undefined'}
            Rate: ${buyData.rate || 'Undefined'}
            Quantity: ${buyData.quantity || 'Undefined'}
            Profit: ${buyData.profit || 'Undefined'}
            buyer: ${buyData.buyer || 'Undefined'}
            Loss: ${buyData.loss || 'Undefined'}</p>
            `;
            sellerContainer.appendChild(buyElement);

            // Add the loss to the total loss
            totalLoss += parseFloat(buyData.loss) || 0;
            totalProfit += parseFloat(buyData.profit) || 0;
        }
    });
}

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    if (user) {
        const currentUserEmail = user.email;
        onValue(ref(database, 'buys'), (snapshot) => {
            displayUserBuys(snapshot, currentUserEmail);
        });
    }
});






//////////////////////////////////////////////////////////////////////////////

document.getElementById('sellTeamA').addEventListener('click', async () => {
    const userBalanceinElement = document.getElementById('userbalancein');
    const ExpoinElement = document.getElementById('Expoin');
    const rateElement = document.getElementById('rate');
    const quantityElement = document.getElementById('quantity');
    const teamalpElement = document.getElementById('teamalp');

    const userBalancein = parseFloat(userBalanceinElement.value);
    const Expoin = parseFloat(ExpoinElement.value);
    const rate = parseFloat(rateElement.value);
    const quantity = parseFloat(quantityElement.value);
    const teamalp = parseFloat(teamalpElement.value);
    const result = rate * quantity / 100;

    console.log("User Balance:", userBalancein);
    console.log("Expo:", Expoin);
    console.log("Rate:", rate);
    console.log("Quantity:", quantity);
    console.log("Team aLP:", teamalp);
    console.log("Result:", result);

    if (userBalancein + teamalp >= result) {
        console.log("Using formula 1 and exiting...");
    
            // Assuming rate is defined elsewhere in your code
            const rate = parseFloat(document.getElementById('rate').value);
    
            const teama = document.getElementById('teama').textContent;
            const currentUser = auth.currentUser;
    
            if (!currentUser) {
                console.log("No user is currently logged in.");
                return;
            }
    
            const useremail = currentUser.email;
            const sellData = {
                teama: teama,
                rate: rate,
                quantity: quantity,
                seller: useremail,
                loss: quantity,
                profit: quantity+quantity*rate/100,
                kya: "aapko lagana hai"
            };
    
            try {
                await push(ref(database, 'sells'), sellData);
                console.log("Data pushed to 'sells' successfully.");
    
                const userRef = ref(database, `users/${currentUser.uid}`);
                const userSnapshot = await get(userRef);
                const userData = userSnapshot.val();
                let teamalp = userData.teamalp || 0;
                let teamblp = userData.teamblp || 0;
                let Balance = userData.Balance || 0;
    
                const loss = rate * quantity / 100;
                const profit = quantity;
    
                teamalp += 0;
                teamblp += loss + profit; // This line seems unnecessary, please verify
    
                Balance -= loss;
    
                await update(userRef, {
                    teamalp: teamalp,
                    teamblp: teamblp,
                    Balance: Balance,
                });
    
                console.log("Updated teamalp, teamblp, and Expo in user's node successfully.");
    
                document.getElementById('rate').value = '';
                document.getElementById('quantity').value = '';
    
            } catch (error) {
                console.error("Error:", error.message);
            }
        } else {
            alert("Your balance is low.");
        }
    });
    
////////////////////////////////////////////////

document.getElementById('buyTeamA').addEventListener('click', async () => {
    const userBalancein = parseFloat(document.getElementById('userbalancein').value);
    const teamblp = parseFloat(document.getElementById('teamblp').value);
    const quantity = parseFloat(document.getElementById('quantity').value);

    if (userBalancein + teamblp >= quantity) {
        console.log("Using Function 1 and exiting...");

        // Assuming rate is defined elsewhere in your code
        const rate = parseFloat(document.getElementById('rate').value);

        const teama = document.getElementById('teama').textContent;
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.log("No user is currently logged in.");
            return;
        }

        const useremail = currentUser.email;
        const sellData = {
            teama: teama,
            rate: rate,
            quantity: quantity,
            seller: useremail,
            loss: quantity*rate/100,
            profit: quantity+quantity*rate/100,
            kya: "aapko khana hai?"
        };

        try {
            await push(ref(database, 'sells'), sellData);
            console.log("Data pushed to 'sells' successfully.");

            const userRef = ref(database, `users/${currentUser.uid}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();
            let teamalp = userData.teamalp || 0;
            let teamblp = userData.teamblp || 0;
            let Balance = userData.Balance || 0;

            const loss = rate * quantity / 100;
            const profit = quantity;

            teamalp += loss + profit;
            teamblp -= 0; // This line seems unnecessary, please verify

            Balance -= profit;

            await update(userRef, {
                teamalp: teamalp,
                teamblp: teamblp,
                Balance: Balance,
            });

            console.log("Updated teamalp, teamblp, and Expo in user's node successfully.");

            document.getElementById('rate').value = '';
            document.getElementById('quantity').value = '';

        } catch (error) {
            console.error("Error:", error.message);
        }
    } else {
        alert("Your balance is low.");
    }
});

///////////////////////////////////////////////////////////////////
document.getElementById('sellTeamb').addEventListener('click', async () => {
    const userBalanceinElement = document.getElementById('userbalancein');
    const ExpoinElement = document.getElementById('Expoin');
    const rateElement = document.getElementById('rate');
    const quantityElement = document.getElementById('quantity');
    const teamblpElement = document.getElementById('teamblp');

    const userBalancein = parseFloat(userBalanceinElement.value);
    const Expoin = parseFloat(ExpoinElement.value);
    const rate = parseFloat(rateElement.value);
    const quantity = parseFloat(quantityElement.value);
    const teamblp = parseFloat(teamblpElement.value);
    const result = rate * quantity / 100;

    console.log("User Balance:", userBalancein);
    console.log("Expo:", Expoin);
    console.log("Rate:", rate);
    console.log("Quantity:", quantity);
    console.log("Team bLP:", teamblp);
    console.log("Result:", result);

    if (userBalancein + teamblp >= result) {
        console.log("Using formula 1 and exiting...");


                    // Assuming rate is defined elsewhere in your code
                    const rate = parseFloat(document.getElementById('rate').value);
    
                    const teamb = document.getElementById('teamb').textContent;
                    const currentUser = auth.currentUser;
            
                    if (!currentUser) {
                        console.log("No user is currently logged in.");
                        return;
                    }
            
                    const useremail = currentUser.email;
                    const sellData = {
                        teamb: teamb,
                        rate: rate,
                        quantity: quantity,
                        seller: useremail,
                        loss: quantity,
                        profit: quantity+quantity*rate/100,
                        kya: "aapko lagana hai"
                    };
            
                    try {
                        await push(ref(database, 'sells'), sellData);
                        console.log("Data pushed to 'sells' successfully.");
            
                        const userRef = ref(database, `users/${currentUser.uid}`);
                        const userSnapshot = await get(userRef);
                        const userData = userSnapshot.val();
                        let teamalp = userData.teamalp || 0;
                        let teamblp = userData.teamblp || 0;
                        let Balance = userData.Balance || 0;
            
                        const loss = rate * quantity / 100;
                        const profit = quantity;
            
                        teamalp += loss + profit;
                        teamblp += 0; // This line seems unnecessary, please verify
            
                        Balance -= loss;
            
                        await update(userRef, {
                            teamalp: teamalp,
                            teamblp: teamblp,
                            Balance: Balance,
                        });
            
                        console.log("Updated teamalp, teamblp, and Expo in user's node successfully.");
            
                        document.getElementById('rate').value = '';
                        document.getElementById('quantity').value = '';
            
                    } catch (error) {
                        console.error("Error:", error.message);
                    }
    
        } else {
            alert("Your balance is low.");
        }
    });
////////////////////////////////////////////////////////////
document.getElementById('buyTeamb').addEventListener('click', async () => {
    const userBalancein = parseFloat(document.getElementById('userbalancein').value);
    const teamalp = parseFloat(document.getElementById('teamalp').value);
    const quantity = parseFloat(document.getElementById('quantity').value);

    if (userBalancein + teamalp >= quantity) {
        console.log("Using Function 1 and exiting...");

        // Assuming rate is defined elsewhere in your code
        const rate = parseFloat(document.getElementById('rate').value);

        const teamb = document.getElementById('teamb').textContent;
        const currentUser = auth.currentUser;

        if (!currentUser) {
            console.log("No user is currently logged in.");
            return;
        }

        const useremail = currentUser.email;
        const sellData = {
            teamb: teamb,
            rate: rate,
            quantity: quantity,
            seller: useremail,
            loss: quantity*rate/100,
            profit: quantity+quantity*rate/100,
            kya: "aapko khana hai?"
        };

        try {
            await push(ref(database, 'sells'), sellData);
            console.log("Data pushed to 'sells' successfully.");

            const userRef = ref(database, `users/${currentUser.uid}`);
            const userSnapshot = await get(userRef);
            const userData = userSnapshot.val();
            let teamalp = userData.teamalp || 0;
            let teamblp = userData.teamblp || 0;
            let Balance = userData.Balance || 0;

            const loss = rate * quantity / 100;
            const profit = quantity;

            teamblp += loss + profit;
            teamalp -= 0; // This line seems unnecessary, please verify

            Balance -= profit;

            await update(userRef, {
                teamalp: teamalp,
                teamblp: teamblp,
                Balance: Balance,
            });

            console.log("Updated teamalp, teamblp, and Expo in user's node successfully.");

            document.getElementById('rate').value = '';
            document.getElementById('quantity').value = '';

        } catch (error) {
            console.error("Error:", error.message);
        }
    } else {
        alert("Your balance is low.");
    }
});

// Reference to the 'teamData' node in the database
const teamDataRef = ref(database, '/teamData');

// Fetch data from Firebase Realtime Database
onValue(teamDataRef, (snapshot) => {
    const teamData = snapshot.val();

    // Update 'result' value in HTML element with id 'rresult'
    const resultElement = document.getElementById('rresult');
    if (resultElement) {
        resultElement.textContent = teamData.result;
    }

    // Update 'teamaa' value in HTML element with id 'teama'
    const teamAElement = document.getElementById('ta');
    if (teamAElement) {
        teamAElement.textContent = teamData.teamaa;
    }

    // Update 'teambb' value in HTML element with id 'teamb'
    const teamBElement = document.getElementById('tb');
    if (teamBElement) {
        teamBElement.textContent = teamData.teambb;
    }

    console.log("Team Data updated successfully!");
}, (error) => {
    console.error("Error fetching team data:", error);
});


// Define a function to handle teamData updates
const handleTeamDataUpdate = async (snapshot, email) => {
    try {
        // Retrieve the updated teamData
        const teamData = snapshot.val();
        console.log("Team Data:");
        console.log("Result:", teamData.result);
        console.log("Teamaa:", teamData.teamaa);
        console.log("Teambb:", teamData.teambb);

        // Check if the result is 'waiting'
        if (teamData.result === 'waiting') {
            console.log("Result is still waiting. User balance will not be updated.");
            return;
        }

        // Calculate the net profit for the current user
        let netProfit = 0;
        const sellsRef = ref(database, '/sells');
        const sellsSnapshot = await get(sellsRef);
        const sellsData = sellsSnapshot.val();
        if (sellsData && typeof sellsData === 'object') {
            Object.values(sellsData).forEach((sell) => {
                if (sell && typeof sell.profit === 'number' && typeof sell.loss === 'number') {
                    if (sell.seller === email) {
                        netProfit += sell.profit - sell.loss;
                    }
                }
            });
        }

        // Update user's balance directly in the database
        const usersRef = ref(database, 'users');
        const userSnapshot = await get(usersRef);
        userSnapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.email === email) {
                const currentBalance = parseFloat(userData.Balance) || 0;
                let totalBalanceChange = 0;
                if (teamData.result === teamData.teamaa) {
                    totalBalanceChange = parseFloat(userData.teamalp) || 0;
                } else if (teamData.result === teamData.teambb) {
                    totalBalanceChange = parseFloat(userData.teamblp) || 0;
                }

                const newBalance = currentBalance + totalBalanceChange + netProfit;
                update(childSnapshot.ref, {
                    Balance: newBalance,
                    teamalp: 0, // Set teamalp to zero
                    teamblp: 0  // Set teamblp to zero
                }).then(() => {
                    console.log('User balance updated successfully!');
                }).catch((error) => {
                    console.error('Error updating user balance:', error);
                });
            }
        });
    } catch (error) {
        console.error("Error handling team data update:", error);
    }
};


// Listen for changes in the 'teamData' node
onValue(teamDataRef, (snapshot) => {
    // Get the current user's email
    const currentUser = auth.currentUser;
    const email = currentUser ? currentUser.email : null;

    // Handle the teamData update
    if (email) {
        handleTeamDataUpdate(snapshot, email);
    } else {
        console.log("No user is currently logged in. Cannot update user balance.");
    }
}, (error) => {
    console.error("Error listening for team data changes:", error);
});


// Reference to the 'sells' node in the database
const sellsRef = ref(database, '/sells');

// Initialize total profit and loss variables
let totalProfit = 0;
let totalLoss = 0;

// Fetch data from Firebase Realtime Database and listen for changes
onValue(sellsRef, (snapshot) => {
    const sellsData = snapshot.val();

    // Reset total profit and loss
    totalProfit = 0;
    totalLoss = 0;

    // Check if sellsData is not null and is an object
    if (sellsData && typeof sellsData === 'object') {
        // Iterate over each sell in sellsData
        Object.values(sellsData).forEach((sell) => {
            // Check if sell has profit and loss fields and they are numbers
            if (sell && typeof sell.profit === 'number' && typeof sell.loss === 'number') {
                // Get the current user's email
                const currentUserEmail = auth.currentUser ? auth.currentUser.email : '';

                // Check if the seller's email matches the current user's email
                if (sell.seller === currentUserEmail) {
                    // Add the profit and loss to the respective total variables
                    totalProfit += sell.profit;
                    totalLoss += sell.loss;
                }
            }
        });

        // Calculate the net profit
        const netProfit = totalProfit - totalLoss;

        // Log the net profit to the console
        console.log("Net profit for current user:", netProfit);

        // Update the value of the input field with id "totalprofit"
        const totalProfitInput = document.getElementById('totalprofit');
        if (totalProfitInput) {
            totalProfitInput.value = netProfit.toString();
        }
    } else {
        console.log("No sells data found.");
    }
}, (error) => {
    console.error("Error fetching sells data:", error);
});
