import { getDatabase, ref, push, update, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

// Initialize Firebase Database
const database = getDatabase();
const auth = getAuth();

// Function to display welcome message with user's name
function displayWelcomeMessage(user) {
    const welcomeContainer = document.getElementById('welcomeContainer');
    const userBalanceElement = document.getElementById('userbalance');
    const ExpoElement = document.getElementById('Expo');
    const Expo2Element = document.getElementById('Expo2');
    
    welcomeContainer.innerHTML = ''; // Clear welcome container

    if (user) {
        // Get current user's email
        const currentUserEmail = user.email;

        // Reference to the users node
        const usersRef = ref(database, 'users');

        // Listen for changes in the users node
        onValue(usersRef, (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const userData = childSnapshot.val();
                if (userData.email === currentUserEmail) {
                    const username = userData.name || 'User';
                    const welcomeMessage = document.createElement('p');
                    const userBalance = userData.Balance || 'Undefined';
                    const userExpo = userData.Expo || 'Undefined';
                    const userExpo2 = userData.Expo2 || 'Undefined';
                    welcomeMessage.textContent = `Welcome, ${username}!`;
                    welcomeContainer.appendChild(welcomeMessage);
                    userBalanceElement.textContent = `User Balance: ${userBalance}`;
                    ExpoElement.textContent = `Expo: ${userExpo}`;
                    Expo2Element.textContent = `Expo2: ${userExpo2}`;
                }
            });
        });
    } else {
        const loginMessage = document.createElement('p');
        loginMessage.textContent = 'Please log in to see the welcome message.';
        welcomeContainer.appendChild(loginMessage);
    }
}

// Listen for authentication state changes
auth.onAuthStateChanged((user) => {
    displayWelcomeMessage(user);
});
/////////////////////////////////////////////////////
document.getElementById('sellButton').addEventListener('click', async () => {
    // Retrieve input values
    const itemName = document.getElementById('itemName').value;
    const rate = document.getElementById('rate').value;
    const quantity = document.getElementById('quantity').value;
    const profit = document.getElementById('profit').value;
    const loss = document.getElementById('loss').value;
    const balance = parseFloat(document.getElementById('balanceInput').value); // Parse input value to float
    const Expo = parseFloat(document.getElementById('expenditureInput').value); // Parse input value to float
    const sellData = {
        itemName,
        rate,
        quantity,
        profit,
        loss
    };

    const currentUser = auth.currentUser;

    if (!currentUser) {
        console.log("No user is currently logged in.");
        return;
    }

    const { email } = currentUser;

    try {
        // Update user's balance and Expo in the database
        const usersRef = ref(database, 'users');
        const userSnapshot = await get(usersRef);
        userSnapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.email === email) {
                const currentBalance = parseFloat(userData.Balance) || 0;
                const currentExpo2 = parseFloat(userData.Expo2) || 0;

                // Calculate the total of Expo and user balance
                const totalBalanceExpo = currentBalance + currentExpo2;

                // Check if the total of Expo and user balance is less than the seller data's loss value
                if (totalBalanceExpo < parseFloat(sellData.loss)) {
                    alert("Total of Expo and user balance is insufficient. Purchase cannot be completed.");
                    return; // Stop further execution
                }

                // Push data to the 'sells' database node
                push(ref(database, 'sells'), {
                    ...sellData,
                    seller: email,
                    Balance: balance,
                    Expo: Expo
                }).then((sellsRef) => {
                    console.log("Data pushed to 'sells' successfully.");
                    
                    // Update balance and Expo by subtracting values
                    const newBalance = currentBalance - parseFloat(loss); // Subtract loss value
                    const newExpo = parseFloat(userData.Expo) + parseFloat(profit) + parseFloat(loss);
                    
                    // Update user's node with updated balance and Expo
                    update(ref(database, `users/${childSnapshot.key}`), {
                        Balance: newBalance,
                        Expo: newExpo
                    }).then(() => {
                        console.log("User balance and Expo updated successfully.");
                        // Update welcome message with the new balance and Expo
                        displayWelcomeMessage(currentUser);

                        // Clear input fields
                        document.getElementById('rate').value = '';
                        document.getElementById('quantity').value = '';
                        document.getElementById('profit').value = '';
                        document.getElementById('loss').value = '';
                    }).catch((error) => {
                        console.error("Error updating user balance and Expo:", error);
                    });
                }).catch((error) => {
                    console.error("Error pushing data to 'sells':", error);
                });
            }
        });
    } catch (error) {
        console.error("Error:", error.message);
    }
});


/////////////////////////////////////////////////////////////////////
// Function to display all sells from the "sells" node
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
                <p>Item Name: ${sellData.itemName || 'Undefined'}</p>
                <p>Rate: ${sellData.rate || 'Undefined'}</p>
                <p>Quantity: ${sellData.quantity || 'Undefined'}</p>
                <p>Profit: ${sellData.profit || 'Undefined'}</p>
                <p>Loss: ${sellData.loss || 'Undefined'}</p>
                <p>Seller: ${sellData.seller || 'Undefined'}</p>
                <button class="buy-button" data-key="${childSnapshot.key}">Buy</button>
            </div>
        `;

        // Append the sell element to the sell container
        sellContainer.appendChild(sellElement);

        // Add event listener to the buy button within this sell element
        const buyButton = sellElement.querySelector('.buy-button');
        buyButton.addEventListener('click', () => {
            const sellKey = buyButton.getAttribute('data-key');
            handleBuyButtonClick(sellKey, sellData);
        });
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
    const userRef = ref(database, 'users');

    // Fetch user data from the database
    get(userRef).then((snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const userData = childSnapshot.val();
            if (userData.email === email) {
                const currentBalance = parseFloat(userData.Balance) || 0;
                const currentExpo = parseFloat(userData.Expo) || 0;
                const currentExpo2 = parseFloat(userData.Expo2) || 0;

                // Calculate the total of Expo and user balance
                const totalBalanceExpo = currentBalance + currentExpo;

                // Check if the total of Expo and user balance is less than the seller data's loss value
                if (totalBalanceExpo < parseFloat(sellData.profit)) {
                    alert("Total of Expo and user balance is insufficient. Purchase cannot be completed.");
                    return; // Stop further execution
                }

                // Calculate new Balance after the purchase
                let newBalance = currentBalance - parseFloat(sellData.profit); // Subtract sellData.profit from the balance

                // Calculate new Expo2 after the purchase
                let newExpo2 = currentExpo2 + parseFloat(sellData.profit) + parseFloat(sellData.loss);

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
                        update(ref(database, `users/${childSnapshot.key}`), {
                            Balance: newBalance,
                            Expo2: newExpo2
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
            }
        });
    }).catch((error) => {
        console.error("Error fetching user data:", error);
    });
}


//////////////////////////
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
                <p>Item Name: ${buyData.itemName || 'Undefined'}
                Rate: ${buyData.rate || 'Undefined'}
                Quantity: ${buyData.quantity || 'Undefined'}
                Profit: ${buyData.profit || 'Undefined'}
                Loss: ${buyData.loss || 'Undefined'}</p>
            `;

            buyContainer.appendChild(buyElement);
            totalLoss += parseFloat(buyData.loss) || 0;
            totalProfit += parseFloat(buyData.profit) || 0;
        }
    });

    // Display the total loss and total profit in the same row
    const totalLossProfitElement = document.getElementById('totalLossProfit');
    totalLossProfitElement.textContent = `Total Loss: ${totalLoss} Total Profit: ${totalProfit}`;
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
                Item Name: ${buyData.itemName || 'Undefined'}
                Rate: ${buyData.rate || 'Undefined'}
                Quantity: ${buyData.quantity || 'Undefined'}
                Profit: ${buyData.profit || 'Undefined'}
                Loss: ${buyData.loss || 'Undefined'}</p>
            `;
            sellerContainer.appendChild(buyElement);

            // Add the loss to the total loss
            totalLoss += parseFloat(buyData.loss) || 0;
            totalProfit += parseFloat(buyData.profit) || 0;
        }
    });

    // Display the total loss
    const totalLossElement = document.getElementById('totalLoss');
    totalLossElement.textContent = `Total Loss: ${totalLoss} Total Profit: ${totalProfit}`;
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
