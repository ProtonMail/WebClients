# DAYLIGHT SAVING TIME (DST): HOW WE DEAL WITH IT

## Important concepts

- UTC - Coordinated Universal Time. This is the standard in the internet world, and also called "Zulu time" (Zulu is the code-name for the letter Z in the military/navy). A time, written as an ISO 8601 string, `1999-05-05T12:00:00.000Z` is a UTC time. We can roughly think of it as GMT time (although there are some slight differences, see "Learn More" section).

- UNIX Timestamp - Number of seconds since `1970-01-01T00:00:00.000Z`. Leap seconds are not counted here, i.e.: every day is assumed to have 24 \* 60 \* 60 seconds (which is not true if you use the definition of UTC second, see "Learn More" section).
- JS (Javascript) Date - A class in JS for representing a date. It can be constructed from a UNIX timestamp in milliseconds as

```JS
new Date(UNIXTimestampInMilliseconds)
```

or from the year, month, day, hours, minutes, seconds and milliseconds as (take into account that `monthIndex = month -1`, i.e. the `monthIndex` for February is `1`)

```JS
new Date(year, monthIndex [, day [, hours [, minutes [, seconds [, milliseconds]]]]])
```

One can also create a date from a string, but that is strongly discouraged because of browser differences and inconsistencies at string parsing. Notice that when creating a date in the second way, the constructor assumes that year, month, day, hours, minutes, seconds and milliseconds are in local time. This can lead to problems in case your JS compiler does not properly detect your local timezone. A less error-prone constructor is the one that takes UTC year, UTC month, ..., UTC milliseconds as parameters. We can do this as

```JS
new Date(Date.UTC(year, month[, day[, hour[, minute[, second[, millisecond]]]]]))
```

where `Date.UTC(...)` returns a UNIX timestamp in milliseconds.

## Why DST wreaks havoc

Because humans like to see dates in terms of years, months, hours and seconds instead of as UNIX timestamps, in the code we have to morally treat dates as objects

```JS
date = { year, month, day, hours, minutes, seconds, tzid }
```

So we need to have a reliable way of moving from this kind of object to UNIX timestamps. Since the JS Date created from a set of years, months, hours and seconds assumes that you have a certain timezone, which may be off or just different from the timezone you want to work in, the only way to deal with this is to create "fake UTC dates".

A fake UTC date is one that mimics a certain timezoned date. For instance, to represent the date `1999-05-05T12:00:00.000+04:00` we would create the fake `1999-05-05T12:00:00.000Z`, using

```JS
const date = new Date(Date.UTC(1955, 4, 5, 12))
```

The year, month, day, etc can be extracted using the functions `date.getUTCFullYear()`, `date.getUTCMonth()`, `date.getUTCDate()`, etc. This fake UTC date corresponds to the real date

```JS
const realDate = new Date(date.getTime() - 4 * 60 * 60 * 1000)
```

If DST did not exist, to move from a fake UTC time to real UTC time and vice versa it would be enough to add/subtract the timezone offset as we did above. Unfortunately, with DST this timezone offset depends on the time itself (on the real one!).

Another issue that we we have to face with DST is the fact that certain timezoned dates do not exist or are ambiguous. Those are the dates where DST shifts:

- DST shift of +1 hour. In this case there is a one-range hour which does not exist. For instance, in the 'Europe/Zurich' timezone, all dates between 31st March 2019 2:00:00 and 31st March 2019 2:59:59 do not exist.
- DST shift of -1 hour. In this case, there is a one-range hour that is ambiguous. For instance, in the 'Europe/Zurich' timezone, the dates between 27th October 2019 2:00:00 and 27th October 2019 2:59:59 happen twice, once before the shift and once afterwards.

Our policy for dealing with these dates is as follows:

- Whenever we come across a date that does not exist, we assume it means the corresponding DST-shifted date.
- Whenever we come across a date that is ambiguous, of the two corresponding dates, we assume it means the latest one.

## Learn more

Time is a relative concept. If you're very picky with it, it can become really tricky. Fortunately, for the purposes of the calendar, we just need to deal with times in the different timezones of the Earth ;). So, to specify a time we need:

1. A time of reference.
2. The offset with respect to the time of reference.

Point 2 is what timezones are for (taking into account DST shifts, of course). Regarding point 1, it looks easy, but not so fast. According to Wikipedia, UTC is the primary time standard by which the world regulates clocks and time. This reference time was set in January 1972 and uses an atomic clock for measuring time[^1].

Traditionally we have not measured the time with atomic clocks, but through astronomical means. UTC time roughly coincides with mean solar time at 0° longitude (UT1), which in turn it is closely related to Greenwich Mean Time (GMT). The thing is that the Earth rotation is slowing down, and there are some other irregularities in its rotation patterns, so not every day has 24 _ 60 _ 60 seconds, but typically a bit less.

Because it would be annoying that in the far future UTC 14:00 be in the middle of the night, the trick is to allow the number of seconds in a day to vary. If a few times per decade we simply declare some days to have 24 _ 60 _ 60 + 1 seconds, we can manage to keep the difference between UTC and UT1 time always under one second. This extra second is called a leap second[^2].

[^1]: A second is (currently) defined as the duration of 9192631770 periods of the radiation corresponding to the transition between the two hyperfine levels of the ground state of the caesium-133 atom.

[^2]: You can find a table of past leap seconds in https://en.wikipedia.org/wiki/Leap_second .
