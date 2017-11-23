var tracks, graph;

document.addEventListener("DOMContentLoaded", function(){
    graph = document.getElementById("graph");
});
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

var params = getHashParams();

var access_token = params.access_token,
refresh_token = params.refresh_token,
error = params.error;

function init(){
    tracks = getAllTracksPlayed();
    console.log(tracks);
    if (tracks.length){
        displayTracks(tracks)
    }else{
        console.log('no tracks in database')
    }
}

function displayTracks(tracks){
    var allPlayed = document.getElementById("allPlayed");
    for(var i=0; i<tracks.length; i++){
        var track = document.createElement("div");
        track.id = tracks[i]._id.track_id;
        track.className = tracks[i]._id.track_id;
        track.innerText = "Track : " +tracks[i]._id.track_name + " | Artist : " + tracks[i]._id.artist_name[0] + " | " + tracks[i]._id.played_at;
        track.addEventListener("click", function(){
            getOneFeature(this.id);
            //alert(this.id);
            
        });
        //getFeaturesForTrack(tracks[i]._id.track_id);
        allPlayed.appendChild(track);
    }
}

function getAllTracksPlayed(){
    const req = new XMLHttpRequest();
	req.open('GET', 'http://localhost:8888/dataTracks', false);
	req.send(null);

	if (req.status === 200) {
		return JSON.parse(req.responseText);
	} else {
		console.log("Status de la réponse: %d (%s)", req.status, req.statusText);
	}
}

function getOneFeature(idtrack){
    const req = new XMLHttpRequest();
	req.open('GET', 'http://localhost:8888/oneTrackFeatures?idTrack=' + idtrack, false);
	req.send(null);

	if (req.status === 200) {
		console.log(JSON.parse(req.responseText));
		displayInfo(JSON.parse(req.responseText));
	} else {
		console.log("Status de la réponse: %d (%s)", req.status, req.statusText);
	}
}

function displayInfo(data){
    var idTrack = document.getElementById("idTrack");
    idTrack.innerText = "";
    generateChart(data);
}

function generateChart(data){
    console.log(data);
    var canvas = document.createElement("canvas");
    canvas.id = "radar-chart";
    graph.innerHTML = "";
    graph.appendChild(canvas);
    //var ctx = canvas.getContext("radar-chart");
    var chart = new Chart("radar-chart", {
        type: 'radar',
        data: {
            labels: ["acousticness", "danceability", "energy", "liveness", "loudness", "speechiness", "tempo"],
            datasets: [
                {
                    label: "",
                    fill: true,
                    backgroundColor: "rgba(179,181,198,0.2)",
                    borderColor: "rgba(179,181,198,1)",
                    pointBorderColor: "#fff",
                    pointBackgroundColor: "rgba(179,181,198,1)",
                    data: [
                        JSON.parse(data.acousticness*100),
                        JSON.parse(data.danceability*100),
                        JSON.parse(data.energy*100),
                        JSON.parse(data.liveness*100),
                        JSON.parse(Math.abs(data.loudness)),
                        JSON.parse(data.speechiness*100),
                        JSON.parse(data.tempo)
                    ]        
                } 
            ]
        },
        options: {
            title: {
              display: true,
              text: 'Features of track : ' + data.id
            }
        }
    });
};

function getFeaturesForTrack(idtrack){
    const req = new XMLHttpRequest();
    
    req.open('GET', 'https://api.spotify.com/v1/audio-features/' + idtrack, false);
    req.setRequestHeader("Authorization", 'Bearer ' + access_token);
	req.send(null);

	if (req.status === 200) {
		writeOnDB(JSON.parse(req.responseText), "features-tracks");
	} else {
		console.log("Status de la réponse: %d (%s)", req.status, req.statusText);
	}
}

/**
 * Post recently played tracks to db
 */
function writeOnDB(data, url){
    const req = new XMLHttpRequest();
    req.open('POST', 'http://localhost:8888/' + url, true);
    req.setRequestHeader("Content-type", "application/json");
    req.send(JSON.stringify(data));
}


///////////////infos oAuth///////////////
var oauthSource = document.getElementById('oauth-template').innerHTML,
oauthTemplate = Handlebars.compile(oauthSource),
oauthPlaceholder = document.getElementById('oauth');

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
///////////////infos oAuth///////////////

if (error) {
alert('There was an error during the authentication');
} else {
    if (access_token) {
     
    ///////////////API PAGE///////////////////

        // render oauth info
        oauthPlaceholder.innerHTML = oauthTemplate({
        access_token: access_token,
        refresh_token: refresh_token
        });

        $('#interfaceAPI').show();
        $('#interfaceCharts').hide();
        document.getElementById('dataApi').addEventListener('click', function () {
            $('#interfaceAPI').show();
            $('#interfaceCharts').hide();
            console.log('okkk');
        });
        
        document.getElementById('dataCharts').addEventListener('click', function () {
            $('#interfaceAPI').hide();
            $('#interfaceCharts').show();
            console.log('poooo');
        });

        ///////////////infos logged///////////////
        var userProfileSource = document.getElementById('user-profile-template').innerHTML,
        userProfileTemplate = Handlebars.compile(userProfileSource),
        userProfilePlaceholder = document.getElementById('user-profile');

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
        ///////////////infos logged///////////////
        
        ///////////////player infos///////////////////
        var fetchPlayerInfo = function(){
            var dataUserInfo = document.getElementById('user-infos-template').innerHTML,
            itemsUserInfoTemplate = Handlebars.compile(dataUserInfo),
            itemsUserInfoPlaceholder = document.getElementById('userInfos');
    
            $.ajax({
                url: 'https://api.spotify.com/v1/me/player',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                success: function (response) {
                    itemsUserInfoPlaceholder.innerHTML = itemsUserInfoTemplate(response);
                }
            });
            setTimeout(function(){
                fetchPlayerInfo();
            }, 1000);
        }
        fetchPlayerInfo();
        ///////////////player infos///////////////////

        ///////////////covers///////////////////
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

        // Then, click on any album from the results to play 30 seconds of its first track
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

        ///////////////recently played///////////////////
        var fetchRecentlyPlayedTracks = function(){  
            
            var recentlyPlayedInfo = document.getElementById('recently-played-template').innerHTML,
            itemsRecentlyPlayedTemplate = Handlebars.compile(recentlyPlayedInfo),
            itemsRecentlyPlayedPlaceholder = document.getElementById('recentlyPlayed');

            $.ajax({
                url: 'https://api.spotify.com/v1/me/player/recently-played?limit=50',
                headers: {
                    'Authorization': 'Bearer ' + access_token
                },
                success: function (res) {
                    itemsRecentlyPlayedPlaceholder.innerHTML = itemsRecentlyPlayedTemplate(res);
                    console.log(res);
                    writeOnDB(res, "add-played-tracks");
                }
            });
            setTimeout(function(){
                fetchRecentlyPlayedTracks();
            }, 10000);
        };
        fetchRecentlyPlayedTracks();   
        ///////////////recently played///////////////////

    ///////////////CHARTS PAGE///////////////////

        //initialisation des tracks et affichage
        init();


    } else {
        // render initial screen
        $('#login').show();
        $('#loggedin').hide();
        $('#dataApi').hide();
        $('#dataCharts').hide();
    }

}

