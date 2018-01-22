export class Football {
    constructor(
       public date: string,
       public league: string,
       public link: string,
       public homeTeam: string,
       public awayTeam: string,
       public homeScore: string,
       public awayScore: string,
       public homePossessions: string,
       public awayPossessions: string,
       public homeShots: string,
       public awayShots: string,
       public homeShotsOnTarget: string,
       public awayShotsOnTarget: string,
       public homeCorners: string,
       public awayCorners: string,
       public homeFouls: string,
       public awayFouls: string,
       public referee: string,
       public attendance: string
    ) {}
}
