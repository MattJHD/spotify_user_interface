(function () {
    
        /**
         * Obtains parameters from the hash of the URL
         * @return Object
         */
        function getHashParams() {
        var hashParams = {};
        var e, r = /([^&;=]+)=?([^&;]*)/g,
            q = window.location.hash.substring(1);
        while (e = r.exec(q)) {
            hashParams[e[1]] = decodeURIComponent(e[2]);
        }
        return hashParams;
        }

        var userProfileSource = document.getElementById('user-profile-template').innerHTML,
        userProfileTemplate = Handlebars.compile(userProfileSource),
        userProfilePlaceholder = document.getElementById('user-profile');

        var oauthSource = document.getElementById('oauth-template').innerHTML,
        oauthTemplate = Handlebars.compile(oauthSource),
        oauthPlaceholder = document.getElementById('oauth');

        var params = getHashParams();

        var access_token = params.access_token,
        refresh_token = params.refresh_token,
        error = params.error;

    ///////////////user infos///////////////////
    var dataUserInfo = document.getElementById('user-infos-template').innerHTML,
        itemsUserInfoTemplate = Handlebars.compile(dataUserInfo),
        itemsUserInfoPlaceholder = document.getElementById('userInfos');
    ///////////////user infos///////////////////

    ///////////////search datas///////////////////
    var dataItemInfo = document.getElementById('datas-template').innerHTML,
        itemsDataTemplate = Handlebars.compile(dataItemInfo),
        itemsDataPlaceholder = document.getElementById('resultsSearch');


    var searchDatasInfo = function (q, type) {
    $.ajax({
        url: 'https://api.spotify.com/v1/search?q=' + q + '&type=' + type,
        headers: {
                'Authorization': 'Bearer ' + access_token
        },
        success: function (response) {
            console.log(response);
            itemsDataPlaceholder.innerHTML = itemsDataTemplate(response);
        }
    });
    };
    document.getElementById('search-item-form').addEventListener('submit', function (e) {
    e.preventDefault();
    searchDatasInfo(document.getElementById('queryItem').value, document.getElementById('queryType').value);
    }, false);
    ///////////////search datas///////////////////

    ///////////////covers///////////////////
    // find template and compile it
    var templateSource = document.getElementById('results-template').innerHTML,
    template = Handlebars.compile(templateSource),
    resultsPlaceholder = document.getElementById('results'),
    playingCssClass = 'playing',
    audioObject = null;

    var fetchTracks = function (albumId, callback) {
    $.ajax({
        url: 'https://api.spotify.com/v1/albums/' + albumId,
        headers: {
                'Authorization': 'Bearer ' + access_token
        },
        success: function (response) {
            callback(response);
        }
    });
    };

    var searchAlbums = function (query) {
    $.ajax({
        url: 'https://api.spotify.com/v1/search',
        data: {
            q: query,
            type: 'album'
        },
        headers: {
                'Authorization': 'Bearer ' + access_token
        },
        success: function (response) {
            resultsPlaceholder.innerHTML = template(response);
        }
    });
    };

    results.addEventListener('click', function (e) {
    var target = e.target;
    if (target !== null && target.classList.contains('cover')) {
        if (target.classList.contains(playingCssClass)) {
            audioObject.pause();
        } else {
            if (audioObject) {
                audioObject.pause();
            }
            fetchTracks(target.getAttribute('data-album-id'), function (data) {
                audioObject = new Audio(data.tracks.items[0].preview_url);
                audioObject.play();
                target.classList.add(playingCssClass);
                audioObject.addEventListener('ended', function () {
                    target.classList.remove(playingCssClass);
                });
                audioObject.addEventListener('pause', function () {
                    target.classList.remove(playingCssClass);
                });
            });
        }
    }else{
        alert('nulll');
    }
    });

    document.getElementById('search-form').addEventListener('submit', function (e) {
    e.preventDefault();
    searchAlbums(document.getElementById('query').value);
    }, false);
    ///////////////covers///////////////////



        if (error) {
        alert('There was an error during the authentication');
        } else {
        if (access_token) {
            // render oauth info
            oauthPlaceholder.innerHTML = oauthTemplate({
            access_token: access_token,
            refresh_token: refresh_token
            });

            $.ajax({
            url: 'https://api.spotify.com/v1/me',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function (response) {
                userProfilePlaceholder.innerHTML = userProfileTemplate(response);
                console.log(response);
                $('#login').hide();
                $('#loggedin').show();
            }
            });
            
            $.ajax({
            url: 'https://api.spotify.com/v1/me/player',
            headers: {
                'Authorization': 'Bearer ' + access_token
            },
            success: function (response) {
                itemsUserInfoPlaceholder.innerHTML = itemsUserInfoTemplate(response);
                console.log(response);
            }
            });
        } else {
            // render initial screen
            $('#login').show();
            $('#loggedin').hide();
        }

        document.getElementById('obtain-new-token').addEventListener('click', function () {
            $.ajax({
            url: '/refresh_token',
            data: {
                'refresh_token': refresh_token
            }
            }).done(function (data) {
            access_token = data.access_token;
            oauthPlaceholder.innerHTML = oauthTemplate({
                access_token: access_token,
                refresh_token: refresh_token
            });
            });
        }, false);
        }



    })();