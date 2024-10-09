var getVPAIDAd = function () {
  var adPaused = false;
  function initializeAd() {
      var intervalId = setInterval(function () {
          var activeElement = document.activeElement;
          if (activeElement && activeElement.tagName === "IFRAME") {
              clearInterval(intervalId);
              if (getClosestParentWithId(activeElement.parentNode).id === "on-c") {
                  handleAdClickThru();
              }
          }
      }, 100);

      var adClicked = false;

      try {
          document.querySelector("iframe").addEventListener("load", function () {
              this.blur();
          });
      } catch (e) {}

      function handleAdClickThru() {
          if (!adClicked) {
              clearInterval(intervalId);
              adClicked = true;
              triggerEvent("AdClickThru");
          }
      }

      document.querySelector("#on-c").addEventListener("click", function () {
          handleAdClickThru();
      });
  }

  function getClosestParentWithId(element) {
      return element.id !== "on-c" ? element.closest("#on-c") : element;
  }

  var adProperties,
      adInterval,
      adContainer,
      adScript,
      adEvents = {},
      eventListeners = {},
      adVolume = 1,
      adElements = {},
      triggerEvent = function (eventName) {
          if (eventName in eventListeners) {
              for (var i = 0; i < eventListeners[eventName].length; i++) {
                  eventListeners[eventName][i]();
              }
          }
      };

  var VPAID_EVENTS = {
    AdStarted: "AdStarted",
    AdStopped: "AdStopped",
    AdSkipped: "AdSkipped",
    AdLoaded: "AdLoaded",
    AdLinearChange: "AdLinearChange",
    AdSizeChange: "AdSizeChange",
    AdExpandedChange: "AdExpandedChange",
    AdSkippableStateChange: "AdSkippableStateChange",
    AdDurationChange: "AdDurationChange",
    AdRemainingTimeChange: "AdRemainingTimeChange",
    AdVolumeChange: "AdVolumeChange",
    AdImpression: "AdImpression",
    AdClickThru: "AdClickThru",
    AdInteraction: "AdInteraction",
    AdVideoStart: "AdVideoStart",
    AdVideoFirstQuartile: "AdVideoFirstQuartile",
    AdVideoMidpoint: "AdVideoMidpoint",
    AdVideoThirdQuartile: "AdVideoThirdQuartile",
    AdVideoComplete: "AdVideoComplete",
    AdUserAcceptInvitation: "AdUserAcceptInvitation",
    AdUserMinimize: "AdUserMinimize",
    AdUserClose: "AdUserClose",
    AdPaused: "AdPaused",
    AdPlaying: "AdPlaying",
    AdError: "AdError",
    AdLog: "AdLog"
  };

  adEvents.handshakeVersion = function (version) {
      return "2.0";
  };

  adEvents.initAd = function (width, height, viewMode, desiredBitrate, creativeData, environmentVars) {
    console.log('environmentVars: ', environmentVars);
    adProperties = {
        slot: environmentVars.slot,
        videoSlot: environmentVars.videoSlot,
        width: width,
        height: height,
        viewMode: viewMode,
        expanded: false,
        skippableState: false,
        duration: 60,
        remainingTime: 60,
        skipDuration: 5,
        startTime: 0,
        ready: false
    };

    // Listen for messages from the cross-domain iframe
    window.addEventListener('message', function(event) {

      // Ensure the message is from the correct origin (the cross-domain iframe's origin)
      if (event.origin !== '{{ad_serve_domain}}') { 
          return;
      }

      // Check if the message contains all the data
      if (event.data && event.data.action === 'sendAllData') {
        // Render the video src
        if (event.data.videoSrc) {
            setupVideoSlot(event.data.videoSrc);
        }
        // Render the headline
        if (event.data.headlineText) {
            createAndRenderHeadline(event.data.headlineText);
        }
        // Render the button text 
        if (event.data.buttonText) {
            createAndRenderButton(event.data.buttonText);
        }
      } 
    });

    initializeAdContainer(); // Initialize the ad container`
    adProperties.ready = true; // Set the ad as ready
    triggerEvent("AdLoaded"); // Dispatch the AdLoaded event
  };

  // Use the provided videoSlot if available
  function setupVideoSlot(videoSrc) {
    if (adProperties.videoSlot) {
      console.log('Using provided video slot element');
      adProperties.videoSlot.src = videoSrc;
      adProperties.videoSlot.play().catch(function(error) {
        console.log('Error playing video: ', error);
      });

      adProperties.videoSlot.addEventListener('loadedmetadata', function () {
        var videoDuration = adProperties.videoSlot.duration;

        if (typeof adProperties !== 'undefined') {
          console.log('Setting duration: ', videoDuration);
          adProperties.duration = videoDuration;
          adEvents.onAdDurationChange();
          console.log('Duration set: ', adProperties.duration);
        }
      });

      adProperties.videoSlot.addEventListener('loadeddata', function() {
        adProperties.videoSlot.play().catch(function(error) {
          console.log('Error playing video: ', error);
        });
      });

      adProperties.videoSlot.addEventListener('error', function(e) {
        console.log('Error playing video: ', e);
      });
    } else {
      console.log('videoSlot not provided');
    }

  }

  adEvents.startAd = function () {
    if (!adProperties.ready) {
        return setTimeout(adEvents.startAd, 250);
    }
    
    // Start playback of the video 
    if (adProperties.videoSlot) {
      adProperties.videoSlot.play().catch(function(error) {
        console.log('Error playing video: ', error);
      });
    } else {
      console.log('videoSlot not provided');
    }

    adProperties.startTime = getCurrentTime(); // Set the start time of the ad
    adInterval = setInterval(updateAd, 500); // Set the interval to update the ad
    triggerEvent("AdStarted");  // Dispatch the AdStarted event
  };

  function str_to_element (str_elem) {
    var elem = document.createElement('div');
    elem.innerHTML = str_elem;
    return elem.firstChild;
  }

  // Function to dynamically create and insert the headline text
  function createAndRenderHeadline(headlineText) {

    // Define the headline HTML with inline styles
    var headlineHTML = str_to_element('<div class="video-headline" style="font-size: 18px;font-weight: normal;color: #fff;text-shadow: 0px 0px 7px #00000094;flex:1;"></div>');
    headlineHTML.innerText = headlineText;

    // Get or create the container div
    var container = createElementsContainer();

    // Append the headline to the container
    container.appendChild(headlineHTML);
  }
  // Function to dynamically create and insert the button text
  function createAndRenderButton(buttonText) {

    var buttonHTML = str_to_element('<div class="button-text" style="font-size: 16px;font-weight: bold;color: #1c85f2;padding: 15px 10px;border: 1px solid #fff;border-radius: 5px;background-color: #ffffff;text-align: center;box-shadow: 0px 0px 6px #00000040;flex-shrink: 0;"></div>');
    buttonHTML.innerText = buttonText;

    // Get or create the container div
    var container = createElementsContainer();

    // Append the button to the container
    container.appendChild(buttonHTML);
  }

  // Function to create or get the container div for headline and button
  function createElementsContainer() {
    // Check if the container already exists
    var container = document.getElementById('elements-container');
    
    if (!container) {
        // Create the container div
        container = str_to_element('<div id="elements-container" style="position: absolute;display: flex;justify-content: space-between;align-items: center;gap: 10px;padding: 15px;z-index: 997;background: linear-gradient(180deg, #00000099, transparent);box-sizing:border-box;width:100%;"></div>');

        // Find the reference div to insert the container before it
        var referenceDiv = document.getElementById('on-c');
        if (referenceDiv) {
            referenceDiv.parentNode.insertBefore(container, referenceDiv);
        }
    }
    
    return container;
}

  adEvents.stopAd = function () {
    adProperties.ready = false;
    clearTimeout(adInterval);

    // Explicitly stop and remove the video element if it exists
    if (adProperties.videoSlot) {
        try {
            adProperties.videoSlot.pause(); // Stop the video
            adProperties.videoSlot.src = ""; // Clear the source
            adProperties.videoSlot.load(); // Ensure the video stops loading
        } catch (e) {
            console.log("Error stopping the video: ", e);
        }
        // Remove the video element from its parent container
        if (adProperties.videoSlot.parentNode) {
            adProperties.videoSlot.parentNode.removeChild(adProperties.videoSlot);
        }
    }

    // Remove the ad container if it exists
    if (adContainer && adContainer.parentNode) {
        adContainer.parentNode.removeChild(adContainer);
    }

    // Dispatch the AdStopped event after a short delay to allow DOM updates
    setTimeout(function () {
        triggerEvent("AdStopped");
    }, 100);
  };


  adEvents.resizeAd = function (width, height, viewMode) {
      adProperties.width = width;
      adProperties.height = height;
      adProperties.viewMode = viewMode;
      updateAdContainer();
      triggerEvent("AdSizeChange");
  };

  adEvents.pauseAd = function () {
    if (adProperties.videoSlot) {
      adProperties.videoSlot.pause();
    }
    adPaused = true;
    triggerEvent("AdPaused");
    console.log('Ad paused, updating state');
  };

  adEvents.resumeAd = function () {
    if (adProperties.videoSlot) {
      adProperties.videoSlot.play();
    }
    adPaused = false;
    adProperties.startTime = getCurrentTime() - (adProperties.duration - adProperties.remainingTime);
    triggerEvent("AdPlaying");
    console.log('Ad resumed, updating state');
  };

  adEvents.onAdImpression = function () {
    triggerEvent(VPAID_EVENTS.AdImpression);
  };

  adEvents.onAdVolumeChange = function () {
      console.log('On Ad Volume changed');
      triggerEvent(VPAID_EVENTS.AdVolumeChange); // Dispatch the volume change event
  };

  adEvents.onAdVideoStart = function () {
    triggerEvent(VPAID_EVENTS.AdVideoStart);
  };

  adEvents.expandAd = function () {
      adProperties.expanded = true;
      triggerEvent("AdExpanded");
  };

  adEvents.collapseAd = function () {
      adProperties.expanded = false;
  };

  adEvents.skipAd = function () {
      if (adProperties.skippableState) {
          triggerEvent("AdSkipped");
      }
  };

  adEvents.getAdLinear = function () {
      return true;
  };

  adEvents.getAdWidth = function () {
      return adProperties.width;
  };

  adEvents.getAdHeight = function () {
      return adProperties.height;
  };

  adEvents.getAdExpanded = function () {
      return adProperties.expanded;
  };

  adEvents.getAdSkippableState = function () {
      return adProperties.skippableState;
  };

  adEvents.getAdRemainingTime = function () {
      console.log('Getting remaining time', adProperties.remainingTime);
      return adProperties.remainingTime;
  };

  adEvents.getAdDuration = function () {
    return adProperties.duration;
  };

  adEvents.onAdDurationChange = function () {
	  triggerEvent(VPAID_EVENTS.AdDurationChange);
  };

  adEvents.getAdVolume = function () {
    return adVolume;
  };

  adEvents.setAdVolume = function (volume) {
    var isChanged = adVolume !== adProperties.adVolume;
    console.log('Setting volume to: ' + volume);
    if (isChanged) {
      adVolume = volume;
      if (adProperties.adVolume) {
        adProperties.videoSlot.volume = adVolume;
      }
      triggerEvent(VPAID_EVENTS.AdVolumeChange);
    }
    var oldVolume = adVolume;
    adVolume = volume; // Set the new volume level

    if (adVolume !== oldVolume) {
      if (adProperties.videoSlot) {
          adProperties.videoSlot.volume = adVolume;
          console.log('Ad properties volume: ' + adProperties.videoSlot.volume);
      }

      var dynamicVideo = document.getElementById('dynamic-video');
      if (dynamicVideo) {
          dynamicVideo.volume = adVolume;
          console.log('Volume: ' + dynamicVideo.volume);
      }
      console.log('adVolume changed');
      triggerEvent(VPAID_EVENTS.AdVolumeChange); // Trigger the AdVolumeChange event
    }
  };

  adEvents.getAdCompanions = function () {
      return "";
  };

  adEvents.getAdIcons = function () {
      return "";
  };

  adEvents.subscribe = function (callback, eventName, context) {
    callback = callback.bind(context);
    if (!(eventName in eventListeners)) {
        eventListeners[eventName] = [];
    }
    eventListeners[eventName].push(callback);
  };

  adEvents.unsubscribe = function (eventName) {
      eventListeners[eventName] = [];
  };

  function getCurrentTime() {
      return new Date().getTime() / 1000;
  }

  function updateAdContainer() {}

  function initializeAdContainer() {
    var container = document.createElement("div");
    container.style.position = "relative";
    container.style.height = "100%";
    if ((window.innerHeight || document.documentElement.clientHeight) >= 240) {
        container.style.display = "flex";
    }
    container.style.font = "normal 14px/1.15 sans-serif";
    container.style.boxSizing = "border-box";

    if (window.top !== window) {
        window.ldAdInit = window.ldAdInit || [];
        window.ldAdInit.push({ slot: {slot_id}, size: [0, 0], id: "ld-3701-3915" });
    }

    container.innerHTML = '<div id="on-c" style="box-sizing:border-box;width:100%;padding:0px;height:100%;position:absolute;opacity:0;z-index:999"><div id="ld-3701-3915" data-ld-vpaid="1" style="width:100%"></div></div>' + getSkipButtonHtml();

    var adSlot = container.childNodes[0].childNodes[0];
    var adImpressionInterval = setInterval(function () {
        if (adSlot.offsetHeight) {
            setTimeout(function () {
                triggerEvent("AdImpression");
            }, 1000);
            var adLinks = adSlot.querySelectorAll("a");
            for (var i = 0; i < adLinks.length; i++) {
                adLinks[i].onclick = function () {
                    triggerEvent("AdClickThru");
                };
            }
            clearInterval(adImpressionInterval);
        }
    }, 500);

    adElements.skip = container.querySelectorAll("#skip")[0];
    adElements.remaining = container.querySelectorAll("#remaining")[0];
    adElements.links = container.querySelectorAll("a");

    for (var i = 0; i < adElements.links.length; i++) {
        adElements.links[i].onclick = function () {
            triggerEvent("AdClickThru");
        };
    }

    adProperties.slot.appendChild(container);
    adContainer = container;

    adScript = document.createElement("script");
    adScript.id = "ld-ajs";
    adScript.src = "{{cdn_domain}}/_js/ajs.js";
    adScript.async = true;
    document.head.appendChild(adScript);

    var styleElement = document.createElement("style");
    styleElement.type = "text/css";
    styleElement.appendChild(document.createTextNode(""));
    document.head.appendChild(styleElement);

    adProperties.ready = true;
    triggerEvent("AdLoaded");
    initializeAd();
  }

  function getSkipButtonHtml() {
    return (
      '<div id="skip" style="user-select: none;cursor:pointer;color:#ffffff;background-color:#000000a0;padding:8px 10px;border:1px solid #ffffff4d;white-space:nowrap;position:absolute;bottom:5%;right:15px;z-index:1000;border-radius:20px;">Skip in <span id="remaining">' +
      adProperties.skipDuration
    );
  }

  function updateAd() {
    if (adPaused) {
        return;  // Do not update the ad if it is paused
    }
    // Calculate remaining time based on video slot's currentTime
    if (adProperties.videoSlot) {
      adProperties.remainingTime = adProperties.duration - adProperties.videoSlot.currentTime;
    }
    // Update skip duration timer and display remaining time
    var elapsedTime = getCurrentTime() - adProperties.startTime;
    var remainingTime = Math.floor(adProperties.skipDuration - elapsedTime);

    if (remainingTime > 0) {
        adElements.remaining.innerHTML = remainingTime;
    } else if (adElements.remaining) {
        if (adElements.remaining.parentNode) {
            adElements.remaining.parentNode.removeChild(adElements.remaining);
        }
        adElements.remaining = null;
        adElements.skip.innerHTML = "Close Ad";
        adElements.skip.style.color = "#FFF";
        adElements.skip.style.backgroundColor = "#000000cc";
        adElements.skip.style.borderColor = "#FFF";
        adElements.skip.style.fontWeight = "bold";
        adElements.skip.onclick = function () {
            triggerEvent("AdUserClose");
            adEvents.stopAd();
        };
    } else if (adProperties.remainingTime <= 0) {
        adEvents.stopAd();
    }
    triggerEvent("AdRemainingTimeChange"); // Trigger the remaining time change event
  }

  return adEvents;
};