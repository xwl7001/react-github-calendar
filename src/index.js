import React, { Component } from 'react';
import PropTypes from 'prop-types';
import parse from 'github-calendar-parser'
import $ from "elly"
import addSubtractDate from "add-subtract-date"
import formatoid from "formatoid"

import './GithubCalendar.less';

/**
 * GitHubCalendar
 * Brings the contributions calendar from GitHub (provided username) into your page.
 *
 * @name GitHubCalendar
 * @function
 * @param {String|HTMLElement} container The calendar container (query selector or the element itself).
 * @param {String} username The GitHub username.
 * @param {Object} options An object containing the following fields:
 *
 *  - `summary_text` (String): The text that appears under the calendar (defaults to: `"Summary of
 *    pull requests, issues opened, and commits made by <username>"`).
 *  - `proxy` (Function): A function that receives as argument an url (string) and should return the proxied url.
 *    The default is using [@izuzak](https://github.com/izuzak)'s [`urlreq`](https://github.com/izuzak/urlreq).
 *  - `global_stats` (Boolean): If `false`, the global stats (total, longest and current streaks) will not be calculated and displayed. By default this is enabled.
 *  - `responsive` (Boolean): If `true`, the graph is changed to scale with the container. Custom CSS should be applied to the element to scale it appropriately. By default this is disabled.
 *
 * @return {Promise} A promise returned by the `fetch()` call.
 */
class GithubCalender extends Component{

    constructor(props){
        super(props)

        const username = this.props.username

        this.options = {};
        this.options.summary_text = this.props.text 
            || `Summary of pull requests, issues opened, and commits made by <a href="https://github.com/${username}" target="blank">@${username}</a>`;
        this.options.global_stats = this.props.global_stats === false || true

        // We need a proxy for CORS
        // Thanks, @izuzak (https://github.com/izuzak/urlreq)
        this.options.proxy = this.props.proxy || function proxy(url) {
            return `https://urlreq.appspot.com/req?method=GET&url=${url}`;
        };
    }

    createGithubCalender(container, username, options){
        const DATE_FORMAT1 = "MMM D, YYYY"
        const DATE_FORMAT2 = "MMMM D"
        
        if (options.global_stats === false) {
            container.style.minHeight = "175px";
        }

    const fetchCalendar = () => fetch(options.proxy(`https://github.com/${username}`))
    .then(response => response.text()).then(body => {
        const div = document.createElement("div");
        div.innerHTML = body;
        const cal = div.querySelector(".js-yearly-contributions");
        cal.querySelector(".float-left.text-gray").innerHTML = options.summary_text;

        // If 'include-fragment' with spinner img loads instead of the svg, fetchCalendar again
        if (cal.querySelector("include-fragment")) {
            setTimeout(fetchCalendar, 500);
        } else {
            // If options includes responsive, SVG element has to be manipulated to be made responsive
            if (options.responsive === true) {
                const svg = cal.querySelector("svg.js-calendar-graph-svg");
                // Get the width/height properties and use them to create the viewBox
                const width = svg.getAttribute("width");
                const height = svg.getAttribute("height");
                // Remove height property entirely
                svg.removeAttribute("height");
                // Width property should be set to 100% to fill entire container
                svg.setAttribute("width", "100%");
                // Add a viewBox property based on the former width/height
                svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
            }

            if (options.global_stats !== false) {
                const parsed = parse($("svg", cal).outerHTML)
                const currentStreakInfo = parsed.current_streak
                                      ? `${formatoid(parsed.current_streak_range[0], DATE_FORMAT2)} &ndash; ${formatoid(parsed.current_streak_range[1], DATE_FORMAT2)}`
                                      : parsed.last_contributed
                                      ? `Last contributed in ${formatoid(parsed.last_contributed, DATE_FORMAT2)}.`
                                      : "Rock - Hard Place"
                const longestStreakInfo = parsed.longest_streak
                                      ? `${formatoid(parsed.longest_streak_range[0], DATE_FORMAT2)} &ndash; ${formatoid(parsed.longest_streak_range[1], DATE_FORMAT2)}`
                                      : parsed.last_contributed
                                      ? `Last contributed in ${formatoid(parsed.last_contributed, DATE_FORMAT2)}.`
                                      : "Rock - Hard Place"
                const firstCol = $("<div>", {
                        "class": "contrib-column contrib-column-first table-column"
                      , html: `<span class="text-muted">Contributions in the last year</span>
                               <span class="contrib-number">${parsed.last_year} total</span>
                               <span class="text-muted">${formatoid(addSubtractDate.subtract(new Date(), 1, "year"), DATE_FORMAT1)} &ndash; ${formatoid(new Date(), DATE_FORMAT1)}</span>`
                    })
                const secondCol = $("<div>", {
                        "class": "contrib-column table-column"
                      , html: `<span class="text-muted">Longest streak</span>
                               <span class="contrib-number">${parsed.longest_streak} days</span>
                               <span class="text-muted">${longestStreakInfo}</span>`
                    })
                const thirdCol = $("<div>", {
                        "class": "contrib-column table-column"
                      , html: `<span class="text-muted">Current streak</span>
                               <span class="contrib-number">${parsed.current_streak} days</span>
                               <span class="text-muted">${currentStreakInfo}</span>`
                    })

                cal.appendChild(firstCol);
                cal.appendChild(secondCol);
                cal.appendChild(thirdCol);
            }

            container.innerHTML = cal.innerHTML;
        }
    }).catch(e => console.error(e));

    return fetchCalendar();

    }

    componentDidMount(){
        this.createGithubCalender(document.getElementById('react-github-id'), this.props.username,this.options)
        // // proxy for cors
        // const proxy = this.props.proxy || 'https://urlreq.appspot.com/req'
        // const fetchCalendar = () => 
        // fetch(`${proxy}?method=GET&url=https://github.com/${this.props.username}`)
        // .then(response => response.text()).then(body => {
        //     // this.createGithubCalender(body);
        //     const div = document.createElement("div");
        //     div.innerHTML = body;
        //     const cal = div.querySelector(".js-contribution-graph");
        //     const hyperlink = `<a href='http://github.com/${this.props.username}'>${this.props.username}</a>`;
        //     const text = this.props.text || "Contributed by ";
        //     cal.querySelector(".float-left.text-gray").innerHTML = text+" "+hyperlink;
        //     document.getElementById('react-github-id').innerHTML = cal.innerHTML;
        // }).catch(e => console.error(e));
        // fetchCalendar();
    }

    render(){
        return(
            <div className="github-calendar" id="react-github-id"></div>
        )
    }

}


GithubCalender.propTypes = {
    username: PropTypes.string.isRequired, // Github user name
    text: PropTypes.string, // custom text to display
    proxy: PropTypes.string // proxy url to fetch github page
}

GithubCalender.defaultProps = {
    text: "All commits done by"
};

export default GithubCalender;