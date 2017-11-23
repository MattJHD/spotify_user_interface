var tracks;

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
            //getFeatures(this.id);
            alert(this.id);
        });
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

function createGraph(data) {
    var dates = [];
    var sum = [];
	var trackName = [];
	for (var i = 0; i < data.length; i++) {
			dates.push(data[i]._id.played_at);
            sum.push(Math.round(data[i].somme.toString()));
            trackName.push(data[i].track_id);
	}
	var canvas = document.createElement("canvas");
	canvas.id = "trackSum";
	graphBar.innerHTML = "";
	graphBar.appendChild(canvas);
	var ctx = canvas.getContext('2d');
	var myChart = new Chart(ctx, {
		type: 'line',
		data: {
			labels: trackName,
			datasets: [{
				label: '% nombre d\'écoute',
				data:sum,
				backgroundColor: hexToRgbA(currentColor)

			}]
		},
		options: {
			scales: {
				yAxes: [{
					ticks: {
						beginAtZero: true,
						max: 100
					}
				}]
			}
				// responsive:false
			}
		});
}

/**
 * Post recently played tracks to db
 */
function writeDBRecentlyPlayed(data){
    const req = new XMLHttpRequest();
    req.open('POST', 'http://localhost:8888/add-played-tracks', true);
    req.setRequestHeader("Content-type", "application/json");
    req.send(JSON.stringify(data));
}

var params = getHashParams();

var access_token = params.access_token,
refresh_token = params.refresh_token,
error = params.error;

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
                    writeDBRecentlyPlayed(res);
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

