function isLoggedIn() {
    return !!firebase.auth().currentUser;
}

function loginUser(username, password) {
    localStorage.setItem("username", username);
    localStorage.setItem("password", password);
    console.log("User logged in:", username);
}

function logoutUser() {
    firebase
        .auth()
        .signOut()
        .then(() => {
            console.log("User logged out");
            localStorage.removeItem("username");
            localStorage.removeItem("password");
            window.location.href = "index.html";
        })
        .catch((error) => {
            console.error("Logout error:", error);
        });
}

function loadUsers() {
    const userList = document.getElementById("user-list");
    db.collection("users")
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const user = doc.data();
                const listItem = document.createElement("li");
                listItem.innerHTML = `${user.email} <button onclick="blockUser('${doc.id}')">Блокувати</button>`;
                userList.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error("Помилка при отриманні користувачів:", error);
        });
}

function loadBooks() {
    const contentList = document.getElementById("content-list");
    db.collection("books")
        .get()
        .then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const book = doc.data();
                const listItem = document.createElement("li");
                listItem.innerHTML = `${book.title} <button onclick="editBook('${doc.id}')">Редагувати</button> <button onclick="deleteBook('${doc.id}')">Видалити</button>`;
                contentList.appendChild(listItem);
            });
        })
        .catch((error) => {
            console.error("Помилка при отриманні книг:", error);
        });
}

function deleteBook(bookId) {
    db.collection("books")
        .doc(bookId)
        .delete()
        .then(() => {
            alert("Книгу видалено");
            location.reload();
        })
        .catch((error) => {
            console.error("Помилка при видаленні книги:", error);
        });
}

document.addEventListener("DOMContentLoaded", function () {
    const searchForm = document.getElementById("search-form");
    if (searchForm) {
        searchForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const query = document.getElementById("search-query").value.trim();
            performSearch(query);
        });
    }

    function performSearch(query) {
        db.collection("books")
            .get()
            .then((querySnapshot) => {
                const results = [];
                querySnapshot.forEach((doc) => {
                    const book = doc.data();
                    if (
                        book.title.includes(query) ||
                        book.author.includes(query)
                    ) {
                        results.push({ id: doc.id, ...book });
                    }
                });
                displayResults(results);
            })
            .catch((error) => {
                console.error("Error searching books:", error);
            });
    }

    function displayResults(results) {
        const resultsSection = document.getElementById("results-section");
        const resultsList = document.getElementById("results-list");
        const addBookSection = document.getElementById("add-book-section");
        resultsList.innerHTML = "";

        if (results.length > 0) {
            resultsSection.style.display = "block";
            addBookSection.style.display = "none";
            results.forEach((book) => {
                const listItem = document.createElement("li");
                listItem.innerHTML = `<a href="book.html?id=${book.id}">${book.title} - ${book.author}</a>`;
                resultsList.appendChild(listItem);
            });

            const existingCloseButton =
                document.getElementById("close-results");
            if (existingCloseButton) {
                existingCloseButton.remove();
            }

            const closeResultsButton = document.createElement("button");
            closeResultsButton.textContent = "✖";
            closeResultsButton.id = "close-results";
            closeResultsButton.style.marginTop = "10px";
            closeResultsButton.addEventListener("click", function () {
                resultsSection.style.display = "none";
            });
            resultsSection.appendChild(closeResultsButton);
        } else {
            resultsSection.style.display = "none";
            addBookSection.style.display = "block";
        }
    }

    const addBookButton = document.getElementById("add-book-button");
    if (addBookButton) {
        addBookButton.addEventListener("click", function () {
            if (isLoggedIn()) {
                window.location.href = "add-book.html";
            } else {
                window.location.href = "login.html";
            }
        });
    }

    const adminLink = document.querySelector('nav ul li a[href="admin.html"]');
    if (adminLink) {
        adminLink.addEventListener("click", function (event) {
            event.preventDefault();
            if (!isLoggedIn()) {
                window.location.href = "login.html";
            } else {
                firebase.auth().onAuthStateChanged((user) => {
                    if (user) {
                        const docRef = db.collection("users").doc(user.uid);
                        docRef
                            .get()
                            .then((doc) => {
                                if (doc.exists && doc.data().role === "admin") {
                                    window.location.href = "admin.html";
                                } else {
                                    alert(
                                        "Недостатньо прав для доступу до панелі адміністратора",
                                    );

                                    window.location.href = "index.html";
                                }
                            })
                            .catch((error) => {
                                console.log(
                                    "Помилка при отриманні документа:",
                                    error,
                                );
                                window.location.href = "index.html";
                            });
                    }
                });
            }
        });
    }
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const email = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            firebase
                .auth()
                .signInWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    const docRef = db.collection("users").doc(user.uid);

                    docRef
                        .get()
                        .then((doc) => {
                            if (doc.exists && doc.data().isBlocked) {
                                alert(
                                    "Ваш акаунт заблоковано. Для розблокування зв'яжіться з нами.",
                                );
                                firebase.auth().signOut();
                                window.location.href = "index.html";
                            } else {
                                if (doc.exists && doc.data().role === "admin") {
                                    window.location.href = "admin.html";
                                } else {
                                    window.location.href = "index.html";
                                }
                            }
                        })
                        .catch((error) => {
                            console.log(
                                "Помилка при отриманні документа:",
                                error,
                            );
                            window.location.href = "index.html";
                        });
                })
                .catch((error) => {
                    alert("Неправильний логін або пароль");
                    console.error("Login error:", error);
                });
        });
    }

    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const email = document.getElementById("email").value;
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            firebase
                .auth()
                .createUserWithEmailAndPassword(email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    return db.collection("users").doc(user.uid).set({
                        username: username,
                        email: email,
                        role: "user", // або 'admin'
                    });
                })
                .then(() => {
                    alert("Реєстрація успішна!");
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    alert("Помилка при реєстрації: " + error.message);
                    console.error("Registration error:", error);
                });
        });
    }

    const addBookForm = document.getElementById("add-book-form");
    if (addBookForm) {
        addBookForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const title = document.getElementById("book-title").value;
            const author = document.getElementById("book-author").value;
            const description =
                document.getElementById("book-description").value;
            const cover = document.getElementById("book-cover").files[0];

            const storageRef = firebase.storage().ref();
            const coverRef = storageRef.child("book-covers/" + cover.name);

            coverRef
                .put(cover)
                .then((snapshot) => {
                    return snapshot.ref.getDownloadURL();
                })
                .then((coverURL) => {
                    const user = firebase.auth().currentUser;
                    if (user) {
                        return db.collection("books").add({
                            title: title,
                            author: author,
                            description: description,
                            image: coverURL,
                            userId: user.uid,
                        });
                    } else {
                        alert("Ви повинні увійти, щоб додати книгу");
                    }
                })
                .then(() => {
                    alert("Книга успішно додана!");
                    window.location.href = "index.html";
                })
                .catch((error) => {
                    alert("Помилка при додаванні книги: " + error.message);
                    console.error("Add book error:", error);
                });
        });
    }

    const params = new URLSearchParams(window.location.search);
    const bookId = params.get("id");
    if (bookId) {
        fetchBookDetails(bookId);
    }

    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            logoutUser();
        });
    }

    firebase.auth().onAuthStateChanged((user) => {
        const authButtons = document.getElementById("auth-buttons");
        const logoutButton = document.getElementById("logout-button");
        if (user) {
            if (authButtons) authButtons.style.display = "none";
            if (logoutButton) logoutButton.style.display = "block";
            if (document.getElementById("books-list")) {
                fetchUserBooks(user.uid);
            }
        } else {
            if (authButtons) authButtons.style.display = "block";
            if (logoutButton) logoutButton.style.display = "none";
        }
    });

    if (
        document.getElementById("user-list") &&
        document.getElementById("content-list")
    ) {
        loadUsers();
        loadBooks();
    }


   
    const weatherForm = document.getElementById('weather-form');
    const cityInput = document.getElementById('city-input');
    const weatherResult = document.getElementById('weather-result');
    const cityName = document.getElementById('city-name');
    const weatherDescription = document.getElementById('weather-description');
    const weatherTemperature = document.getElementById('weather-temperature');
    const loader = document.getElementById('loader');
    const errorMessage = document.getElementById('error-message');
    
    weatherForm.addEventListener('submit', function(event) {
        event.preventDefault();
    
        const city = cityInput.value.trim();
        if (!city) {
            errorMessage.textContent = 'Будь ласка, введіть назву міста';
            errorMessage.style.display = 'block';
            return;
        }
    
    
        weatherResult.style.display = 'none';
        errorMessage.style.display = 'none';
        loader.style.display = 'block';
    
       
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=97edeeb3557bde14341949195ad6cb7b&units=metric&lang=ua`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Помилка при отриманні даних');
                }
                return response.json();
            })
            .then(data => {
                
                loader.style.display = 'none';
    
               
                cityName.textContent = data.name;
                weatherDescription.textContent = `Опис: ${data.weather[0].description}`;
                weatherTemperature.textContent = `Температура: ${data.main.temp}°C`;
                weatherResult.style.display = 'block';
            })
            .catch(error => {
                loader.style.display = 'none';
                errorMessage.textContent = 'Не вдалося отримати дані. Спробуйте ще раз.';
                errorMessage.style.display = 'block';
            });
    });

});


