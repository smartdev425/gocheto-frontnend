import gql from 'graphql-tag'
//import { FACTORY_ADDRESS, BUNDLE_ID } from '../constants'

// interface PairsRequestParams {
//     page: number;
//     rowsPerPage: number;
//     order: string;
//     orderDir: string;
// }

const FACTORY_ADDRESS = '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac'
const BUNDLE_ID = '1'

export const poolsQuery = gql`
    query poolsQuery(
        $first: Int! = 1000
        $skip: Int! = 0
        $orderBy: String! = "timestamp"
        $orderDirection: String! = "desc"
    ) {
        pools(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
            id
            pair
            allocPoint
            lastRewardBlock
            accSushiPerShare
            balance
            userCount
            owner {
                id
                sushiPerBlock
                totalAllocPoint
            }
        }
    }
`

const blockFieldsQuery = gql`
    fragment blockFields on Block {
        id
        number
        timestamp
    }
`

export const blockQuery = gql`
    query blockQuery($start: Int!, $end: Int!) {
        blocks(first: 1, orderBy: timestamp, orderDirection: asc, where: { timestamp_gt: $start, timestamp_lt: $end }) {
            ...blockFields
        }
    }
    ${blockFieldsQuery}
`

export const FACTORY_QUERY = id => {
    return gql`
   query factory {
    factory(id: "${id}") {
      volumeUSD
      liquidityUSD
    }
  }`
}

export const blocksQuery = gql`
    query blocksQuery($first: Int! = 1000, $skip: Int! = 0, $start: Int!, $end: Int!) {
        blocks(
            first: $first
            skip: $skip
            orderBy: number
            orderDirection: desc
            where: { timestamp_gt: $start, timestamp_lt: $end, number_gt: 9300000 }
        ) {
            ...blockFields
        }
    }
    ${blockFieldsQuery}
`

export const pairTokenFieldsQuery = gql`
    fragment pairTokenFields on Token {
        id
        name
        symbol
        totalSupply
        derivedETH
    }
`

export const pairFieldsQuery = gql`
    fragment pairFields on Pair {
        id
        reserveUSD
        reserveETH
        volumeUSD
        untrackedVolumeUSD
        trackedReserveETH
        token0 {
            ...pairTokenFields
        }
        token1 {
            ...pairTokenFields
        }
        reserve0
        reserve1
        token0Price
        token1Price
        totalSupply
        txCount
        timestamp
    }
    ${pairTokenFieldsQuery}
`

export const pairSubsetQuery = gql`
    query pairSubsetQuery(
        $first: Int! = 1000
        $pairAddresses: [Bytes]!
        $orderBy: String! = "trackedReserveETH"
        $orderDirection: String! = "desc"
    ) {
        pairs(first: $first, orderBy: $orderBy, orderDirection: $orderDirection, where: { id_in: $pairAddresses }) {
            ...pairFields
        }
    }
    ${pairFieldsQuery}
`

export const liquidityPositionSubsetQuery = gql`
    query liquidityPositionSubsetQuery($first: Int! = 1000, $user: Bytes!) {
        liquidityPositions(first: $first, where: { user: $user }) {
            id
            liquidityTokenBalance
            user {
                id
            }
            pair {
                id
            }
        }
    }
`

export const SUSHI_PAIRS = (ids, masterChefAddress) => {
    const queryString = `query pools {
    pairs(where: {id_in: ${JSON.stringify(ids)}}) {
        id
        token0 {
            id
            decimals
            symbol
            derivedETH
        }
        token1 {
            id
            decimals
            symbol
            derivedETH
        }
        reserve0
        reserve1
        totalSupply
        reserveETH
        reserveUSD
        trackedReserveETH
    }

    liquidityPositions(where: {user: ${JSON.stringify(masterChefAddress)}, pair_in: ${JSON.stringify(ids)}}) {
        pair {
          id
        }
        liquidityTokenBalance
    }
  }
`
    return gql(queryString)
}

// patch masterchef queries
const poolUserFragment = gql`
    fragment PoolUser on User {
        id
        address
        pool {
            id
            pair
            balance
            accSushiPerShare
            lastRewardBlock
        }
        amount
        rewardDebt
        entryUSD
        exitUSD
        sushiHarvested
        sushiHarvestedUSD
        sushiHarvestedSinceLockup
        sushiHarvestedSinceLockupUSD
    }
`

export const poolUserQuery = gql`
    query poolUserQuery($address: String!, $amount_gt: Int! = 0) {
        users(where: { address: $address, amount_gt: $amount_gt }) {
            ...PoolUser
        }
    }
    ${poolUserFragment}
`

export const SUBGRAPH_HEALTH = gql`
    query health {
        indexingStatusForCurrentVersion(subgraphName: "ianlapham/uniswapv2") {
            synced
            health
            chains {
                chainHeadBlock {
                    number
                }
                latestBlock {
                    number
                }
            }
        }
    }
`

export const V1_DATA_QUERY = gql`
    query uniswap($date: Int!, $date2: Int!) {
        current: uniswap(id: "1") {
            totalVolumeUSD
            totalLiquidityUSD
            txCount
        }
        oneDay: uniswapHistoricalDatas(
            where: { timestamp_lt: $date }
            first: 1
            orderBy: timestamp
            orderDirection: desc
        ) {
            totalVolumeUSD
            totalLiquidityUSD
            txCount
        }
        twoDay: uniswapHistoricalDatas(
            where: { timestamp_lt: $date2 }
            first: 1
            orderBy: timestamp
            orderDirection: desc
        ) {
            totalVolumeUSD
            totalLiquidityUSD
            txCount
        }
        exchanges(first: 200, orderBy: ethBalance, orderDirection: desc) {
            ethBalance
        }
    }
`

export const GET_BLOCK = gql`
    query blocks($timestampFrom: Int!, $timestampTo: Int!) {
        blocks(
            first: 1
            orderBy: timestamp
            orderDirection: asc
            where: { timestamp_gt: $timestampFrom, timestamp_lt: $timestampTo }
        ) {
            id
            number
            timestamp
        }
    }
`

export const GET_BLOCKS = timestamps => {
    let queryString = 'query blocks {'
    queryString += timestamps.map(timestamp => {
        return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${timestamp +
            600} }) {
      number
    }`
    })
    queryString += '}'
    return gql(queryString)
}

export const POSITIONS_BY_BLOCK = (account, blocks) => {
    let queryString = 'query blocks {'
    queryString += blocks.map(
        block => `
      t${block.timestamp}:liquidityPositions(where: {user: "${account}"}, block: { number: ${block.number} }) { 
        liquidityTokenBalance
        pair  {
          id
          totalSupply
          reserveUSD
        }
      }
    `
    )
    queryString += '}'
    return gql(queryString)
}

export const PRICES_BY_BLOCK = (tokenAddress, blocks) => {
    let queryString = 'query blocks {'
    queryString += blocks.map(
        block => `
      t${block.timestamp}:token(id:"${tokenAddress}", block: { number: ${block.number} }) { 
        derivedETH
      }
    `
    )
    queryString += ','
    queryString += blocks.map(
        block => `
      b${block.timestamp}: bundle(id:"1", block: { number: ${block.number} }) { 
        ethPrice
      }
    `
    )

    queryString += '}'
    return gql(queryString)
}

export const TOP_LPS_PER_PAIRS = gql`
    query lps($pair: Bytes!) {
        liquidityPositions(where: { pair: $pair }, orderBy: liquidityTokenBalance, orderDirection: desc, first: 10) {
            user {
                id
            }
            pair {
                id
            }
            liquidityTokenBalance
        }
    }
`

export const HOURLY_PAIR_RATES = (pairAddress, blocks) => {
    let queryString = 'query blocks {'
    queryString += blocks.map(
        block => `
      t${block.timestamp}: pair(id:"${pairAddress}", block: { number: ${block.number} }) { 
        token0Price
        token1Price
      }
    `
    )

    queryString += '}'
    return gql(queryString)
}

export const SHARE_VALUE = (pairAddress, blocks) => {
    let queryString = 'query blocks {'
    queryString += blocks.map(
        block => `
      t${block.timestamp}:pair(id:"${pairAddress}", block: { number: ${block.number} }) { 
        reserve0
        reserve1
        reserveUSD
        totalSupply 
        token0{
          derivedETH
        }
        token1{
          derivedETH
        }
      }
    `
    )
    queryString += ','
    queryString += blocks.map(
        block => `
      b${block.timestamp}: bundle(id:"1", block: { number: ${block.number} }) { 
        ethPrice
      }
    `
    )

    queryString += '}'
    return gql(queryString)
}

export const ETH_PRICE = block => {
    const queryString = block
        ? `
    query bundles {
      bundles(where: { id: ${BUNDLE_ID} } block: {number: ${block}}) {
        id
        ethPrice
      }
    }
  `
        : ` query bundles {
      bundles(where: { id: ${BUNDLE_ID} }) {
        id
        ethPrice
      }
    }
  `
    return gql(queryString)
}

export const TOKEN_ETH = id => {
    const queryString = `
        query tokenEth {
            tokens(where: { id: "${id}" }, first:1000,orderBy:id) { 
                derivedETH
                id
            }
        }`
    return gql(queryString)
}

export const USER = (block, account) => {
    const queryString = `
    query users {
      user(id: "${account}", block: {number: ${block}}) {
        liquidityPositions
      }
    }
`
    return gql(queryString)
}

export const USER_MINTS_BURNS_PER_PAIR = gql`
    query events($user: Bytes!, $pair: Bytes!) {
        mints(where: { to: $user, pair: $pair }) {
            amountUSD
            amount0
            amount1
            timestamp
            pair {
                token0 {
                    id
                }
                token1 {
                    id
                }
            }
        }
        burns(where: { sender: $user, pair: $pair }) {
            amountUSD
            amount0
            amount1
            timestamp
            pair {
                token0 {
                    id
                }
                token1 {
                    id
                }
            }
        }
    }
`

export const FIRST_SNAPSHOT = gql`
    query snapshots($user: Bytes!) {
        liquidityPositionSnapshots(first: 1, where: { user: $user }, orderBy: timestamp, orderDirection: asc) {
            timestamp
        }
    }
`

export const USER_HISTORY = gql`
    query snapshots($user: Bytes!, $skip: Int!) {
        liquidityPositionSnapshots(first: 1000, skip: $skip, where: { user: $user }) {
            timestamp
            reserveUSD
            liquidityTokenBalance
            liquidityTokenTotalSupply
            reserve0
            reserve1
            token0PriceUSD
            token1PriceUSD
            pair {
                id
                reserve0
                reserve1
                reserveUSD
                token0 {
                    id
                }
                token1 {
                    id
                }
            }
        }
    }
`

export const USER_POSITIONS = gql`
    query liquidityPositions($user: Bytes!) {
        liquidityPositions(where: { user: $user }) {
            pair {
                id
                reserve0
                reserve1
                reserveUSD
                token0 {
                    id
                    symbol
                    derivedETH
                }
                token1 {
                    id
                    symbol
                    derivedETH
                }
                totalSupply
            }
            liquidityTokenBalance
        }
    }
`

export const USER_TRANSACTIONS = gql`
    query transactions($user: Bytes!) {
        mints(orderBy: timestamp, orderDirection: desc, where: { to: $user }) {
            id
            transaction {
                id
                timestamp
            }
            pair {
                id
                token0 {
                    id
                    symbol
                }
                token1 {
                    id
                    symbol
                }
            }
            to
            liquidity
            amount0
            amount1
            amountUSD
        }
        burns(orderBy: timestamp, orderDirection: desc, where: { sender: $user }) {
            id
            transaction {
                id
                timestamp
            }
            pair {
                id
                token0 {
                    symbol
                }
                token1 {
                    symbol
                }
            }
            sender
            to
            liquidity
            amount0
            amount1
            amountUSD
        }
        swaps(orderBy: timestamp, orderDirection: desc, where: { to: $user }) {
            id
            transaction {
                id
                timestamp
            }
            pair {
                token0 {
                    symbol
                }
                token1 {
                    symbol
                }
            }
            amount0In
            amount0Out
            amount1In
            amount1Out
            amountUSD
            to
        }
    }
`

export const PAIR_CHART = gql`
    query pairDayDatas($pairAddress: Bytes!, $skip: Int!) {
        pairDayDatas(
            first: 1000
            skip: $skip
            orderBy: date
            orderDirection: asc
            where: { pairAddress: $pairAddress }
        ) {
            id
            date
            dailyVolumeToken0
            dailyVolumeToken1
            dailyVolumeUSD
            reserveUSD
        }
    }
`

export const PAIR_DAY_DATA = gql`
    query pairDayDatas($pairAddress: Bytes!, $date: Int!) {
        pairDayDatas(
            first: 1
            orderBy: date
            orderDirection: desc
            where: { pairAddress: $pairAddress, date_lt: $date }
        ) {
            id
            date
            dailyVolumeToken0
            dailyVolumeToken1
            dailyVolumeUSD
            totalSupply
            reserveUSD
        }
    }
`

export const PAIR_DAY_DATA_BULK = (pairs, startTimestamp) => {
    let pairsString = `[`
    pairs.map(pair => {
        return (pairsString += `"${pair}"`)
    })
    pairsString += ']'
    const queryString = `
    query days {
      pairDayDatas(first: 1000, orderBy: date, orderDirection: asc, where: { pairAddress_in: ${pairsString}, date_gt: ${startTimestamp} }) {
        id
        pairAddress
        date
        dailyVolumeToken0
        dailyVolumeToken1
        dailyVolumeUSD
        totalSupply
        reserveUSD
      }
    } 
`
    return gql(queryString)
}

export const GLOBAL_CHART = gql`
    query uniswapDayDatas($startTime: Int!, $skip: Int!) {
        uniswapDayDatas(first: 1000, skip: $skip, where: { date_gt: $startTime }, orderBy: date, orderDirection: asc) {
            id
            date
            totalVolumeUSD
            dailyVolumeUSD
            dailyVolumeETH
            totalLiquidityUSD
            totalLiquidityETH
        }
    }
`

export const GLOBAL_DATA = block => {
    const queryString = ` query uniswapFactories {
      uniswapFactories(
       ${block ? `block: { number: ${block}}` : ``} 
       where: { id: "${FACTORY_ADDRESS}" }) {
        id
        totalVolumeUSD
        totalVolumeETH
        untrackedVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
        txCount
        pairCount
      }
    }`
    return gql(queryString)
}

export const GLOBAL_TXNS = gql`
    query transactions {
        transactions(first: 100, orderBy: timestamp, orderDirection: desc) {
            mints(orderBy: timestamp, orderDirection: desc) {
                transaction {
                    id
                    timestamp
                }
                pair {
                    token0 {
                        id
                        symbol
                    }
                    token1 {
                        id
                        symbol
                    }
                }
                to
                liquidity
                amount0
                amount1
                amountUSD
            }
            burns(orderBy: timestamp, orderDirection: desc) {
                transaction {
                    id
                    timestamp
                }
                pair {
                    token0 {
                        id
                        symbol
                    }
                    token1 {
                        id
                        symbol
                    }
                }
                sender
                liquidity
                amount0
                amount1
                amountUSD
            }
            swaps(orderBy: timestamp, orderDirection: desc) {
                transaction {
                    id
                    timestamp
                }
                pair {
                    token0 {
                        id
                        symbol
                    }
                    token1 {
                        id
                        symbol
                    }
                }
                amount0In
                amount0Out
                amount1In
                amount1Out
                amountUSD
                to
            }
        }
    }
`

export const ALL_TOKENS = gql`
    query tokens($skip: Int!) {
        tokens(first: 500, skip: $skip) {
            id
            name
            symbol
            totalLiquidity
        }
    }
`

export const TOKEN_SEARCH = gql`
    query tokens($value: String, $id: String) {
        asSymbol: tokens(where: { symbol_contains: $value }, orderBy: totalLiquidity, orderDirection: desc) {
            id
            symbol
            name
            totalLiquidity
        }
        asName: tokens(where: { name_contains: $value }, orderBy: totalLiquidity, orderDirection: desc) {
            id
            symbol
            name
            totalLiquidity
        }
        asAddress: tokens(where: { id: $id }, orderBy: totalLiquidity, orderDirection: desc) {
            id
            symbol
            name
            totalLiquidity
        }
    }
`

export const PAIR_SEARCH = gql`
    query pairs($tokens: [Bytes]!, $id: String) {
        as0: pairs(where: { token0_in: $tokens }) {
            id
            token0 {
                id
                symbol
                name
            }
            token1 {
                id
                symbol
                name
            }
        }
        as1: pairs(where: { token1_in: $tokens }) {
            id
            token0 {
                id
                symbol
                name
            }
            token1 {
                id
                symbol
                name
            }
        }
        asAddress: pairs(where: { id: $id }) {
            id
            token0 {
                id
                symbol
                name
            }
            token1 {
                id
                symbol
                name
            }
        }
    }
`

export const ALL_PAIRS = gql`
    query pairs($skip: Int!) {
        pairs(first: 500, skip: $skip, orderBy: trackedReserveETH, orderDirection: desc) {
            id
            token0 {
                id
                symbol
                name
            }
            token1 {
                id
                symbol
                name
            }
        }
    }
`

const PairFields = `
  fragment PairFields on Pair {
    id
    txCount
    token0 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    token1 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    reserve0
    reserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    untrackedVolumeUSD
    token0Price
    token1Price
    createdAtTimestamp
  }
`

export const PAIRS_CURRENT = gql`
    query pairs {
        pairs(first: 200, orderBy: trackedReserveETH, orderDirection: desc) {
            id
        }
    }
`

export const PAIR_DATA = (pairAddress, block) => {
    const queryString = `
    ${PairFields}
    query pairs {
      pairs(${block ? `block: {number: ${block}}` : ``} where: { id: "${pairAddress}"} ) {
        ...PairFields
      }
    }`
    return gql(queryString)
}

export const PAIRS_BULK = gql`
    ${PairFields}
    query pairs($allPairs: [Bytes]!) {
        pairs(where: { id_in: $allPairs }, orderBy: trackedReserveETH, orderDirection: desc) {
            ...PairFields
        }
    }
`

export const PAIRS_HISTORICAL_BULK = (block, pairs) => {
    let pairsString = `[`
    pairs.map(pair => {
        return (pairsString += `"${pair}"`)
    })
    pairsString += ']'
    const queryString = `
  query pairs {
    pairs(first: 200, where: {id_in: ${pairsString}}, block: {number: ${block}}, orderBy: trackedReserveETH, orderDirection: desc) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      untrackedVolumeUSD
    }
  }
  `
    return gql(queryString)
}

export const TOKEN_CHART = gql`
    query tokenDayDatas($tokenAddr: String!, $skip: Int!) {
        tokenDayDatas(first: 1000, skip: $skip, orderBy: date, orderDirection: asc, where: { token: $tokenAddr }) {
            id
            date
            priceUSD
            totalLiquidityToken
            totalLiquidityUSD
            totalLiquidityETH
            dailyVolumeETH
            dailyVolumeToken
            dailyVolumeUSD
            mostLiquidPairs {
                id
                token0 {
                    id
                    derivedETH
                }
                token1 {
                    id
                    derivedETH
                }
            }
        }
    }
`

const TokenFields = `
  fragment TokenFields on Token {
    id
    name
    symbol
    derivedETH
    tradeVolume
    tradeVolumeUSD
    untrackedVolumeUSD
    totalLiquidity
    txCount
  }
`

export const TOKENS_CURRENT = gql`
    ${TokenFields}
    query tokens {
        tokens(first: 200, orderBy: tradeVolumeUSD, orderDirection: desc) {
            ...TokenFields
        }
    }
`

export const TOKEN_DAYDATA = gql`
    query tokenQuery($id: String!) {
        token(id: $id) {
            dayData(orderBy: date, orderDirection: desc, first: 2) {
                id
                date
                volumeETH
                volumeUSD
                liquidityETH
                liquidityUSD
                txCount
            }
        }
    }
`

export const VOLUME_QUERY = days => gql`
    query volumeQuery {
        dayDatas(orderBy: date, orderDirection: desc, first: ${days}) {
            id
            date
            volumeETH
            volumeUSD
            liquidityETH
            liquidityUSD
            txCount
            }
        }
`

export const TOKENS_DYNAMIC = block => {
    const queryString = `
    ${TokenFields}
    query tokens {
      tokens(block: {number: ${block}} first: 200, orderBy: tradeVolumeUSD, orderDirection: desc) {
        ...TokenFields
      }
    }
  `
    return gql(queryString)
}

export const TOKEN_DATA = (tokenAddress, block) => {
    const queryString = `
    ${TokenFields}
    query tokens {
      tokens(${block ? `block : {number: ${block}}` : ``} where: {id:"${tokenAddress}"}) {
        ...TokenFields
      }
      pairs0: pairs(where: {token0: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
      pairs1: pairs(where: {token1: "${tokenAddress}"}, first: 50, orderBy: reserveUSD, orderDirection: desc){
        id
      }
    }
  `
    return gql(queryString)
}

export const FILTERED_TRANSACTIONS = gql`
    query($allPairs: [Bytes]!) {
        mints(first: 20, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
            transaction {
                id
                timestamp
            }
            pair {
                token0 {
                    id
                    symbol
                }
                token1 {
                    id
                    symbol
                }
            }
            to
            liquidity
            amount0
            amount1
            amountUSD
        }
        burns(first: 20, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
            transaction {
                id
                timestamp
            }
            pair {
                token0 {
                    id
                    symbol
                }
                token1 {
                    id
                    symbol
                }
            }
            sender
            liquidity
            amount0
            amount1
            amountUSD
        }
        swaps(first: 30, where: { pair_in: $allPairs }, orderBy: timestamp, orderDirection: desc) {
            transaction {
                id
                timestamp
            }
            id
            pair {
                token0 {
                    id
                    symbol
                }
                token1 {
                    id
                    symbol
                }
            }
            amount0In
            amount0Out
            amount1In
            amount1Out
            amountUSD
            to
        }
    }
`

export const ALL_TRANSACTIONS = gql`
    query mints {
        mints(first: 20, orderBy: timestamp, orderDirection: desc) {
            transaction {
                id
                timestamp
            }
            pair {
                token0 {
                    id
                    symbol
                }
                token1 {
                    id
                    symbol
                }
            }
            to
            liquidity
            amount0
            amount1
            amountUSD
        }
        burns(first: 20, orderBy: timestamp, orderDirection: desc) {
            transaction {
                id
                timestamp
            }
            pair {
                token0 {
                    id
                    symbol
                }
                token1 {
                    id
                    symbol
                }
            }
            sender
            liquidity
            amount0
            amount1
            amountUSD
        }
        swaps(first: 30, orderBy: timestamp, orderDirection: desc) {
            transaction {
                id
                timestamp
            }
            id
            pair {
                token0 {
                    id
                    symbol
                }
                token1 {
                    id
                    symbol
                }
            }
            amount0In
            amount0Out
            amount1In
            amount1Out
            amountUSD
            to
        }
    }
`

export const shibaSwapPoolsQuery = gql`
    query poolsQuery(
        $first: Int! = 100
        $skip: Int! = 0
        $orderBy: String! = "timestamp"
        $orderDirection: String! = "desc"
    ) {
        pools(first: $first, skip: $skip, orderBy: $orderBy, orderDirection: $orderDirection) {
            id
            pair
            allocPoint
            lastRewardBlock
            accBonePerShare
            balance
            userCount
            owner {
                id
                bonePerBlock
                totalAllocPoint
            }
        }
    }
`

export const liquidityOfDay = gql`
    query dayDatasQuery($first: Int! = 1, $date: Int! = 0) {
        dayDatas(first: $first, orderBy: date, orderDirection: desc) {
            id
            date
            volumeETH
            volumeUSD
            untrackedVolume
            liquidityETH
            liquidityUSD
            txCount
        }
    }
`

export const TOP_TOKENS_QUERY = (index = -1, scale = 30, chainId = 1) => {
    const allowBuySell = chainId == 109 || chainId == 157
    const qs = `
        query MyQuery {
            tokens(first: ${index < 0 ? 3 : 1}, ${
        index > -1 ? ' skip: ' + index + ',' : ''
    } orderBy: txCount, orderDirection: desc) {
                id
                name
                symbol
                txCount
                volume
                volumeUSD
                dayData(first: ${scale}, orderBy: date, orderDirection: desc) {
                    id
                    priceUSD
                    volumeUSD
                    date
                    txCount
                    ${
                        allowBuySell
                            ? `
                    buytxn
                    selltxn
                    `
                            : ''
                    }
                }
            }
        }
    `

    return gql(qs)
}

export const TOKENS_QUERY = (orderBy = 'volumeUSD', orderDirection = 'desc', chainId = 1) => {
    chainId = chainId && parseInt(chainId + '') ? chainId : 1
    let limit = 5

    if (chainId == 1) {
        if (orderBy == 'timestamp') {
            limit = 100
            orderBy = 'volumeUSD'
        }
    }

    if (chainId == 157 || chainId == 109) {
        if (orderBy == 'volumeUSD') {
            orderBy = 'timestamp'
            limit = 5
        } else if (orderBy == 'timestamp') {
            orderBy = 'volumeUSD'
            limit = 100
        }
    }

    const qs = `
        query getTokens {
            tokens(first: ${limit}, orderBy: ${orderBy}, orderDirection: ${orderDirection}) {
                id
                name
                symbol
                txCount
                volume
                volumeUSD
                liquidity
                dayData(first: 7, orderBy: date, orderDirection: desc) {
                    id
                    priceUSD
                    volumeUSD
                    date
                }
            }
        }
    `

    return gql(qs)
}

export const TOKENS_FULL_QUERY = ({ page, orderBy, order, rowsPerPage, search }) => {
    const skip = (page + 1) * rowsPerPage
    const qs = `
        query MyQuery {
            tokens(
                ${search && search.length ? 'where: {symbol_contains_nocase: "' + search + '"}' : ''}
                first: ${skip}, skip: 0, orderBy: ${orderBy}, orderDirection: ${order}) {
                id
                symbol
                name
                volumeUSD
                dayData(first: 7, orderBy: date, orderDirection: desc) {
                    priceUSD
                    volumeUSD
                    date
                    txCount
                }
            }
            factories {
                tokenCount
            }
        }
    `
    return gql(qs)
}

export const PL_VOLUME_QUERY = ({ token0, token1 }) => {
    const qs = `
        query MyQuery {
            pairs(
              where: {token0: "${token0}", token1: "${token1}"}
            ) {
              dayData {
                volumeUSD
              }
              token0 {
                id
                symbol
                name
              }
              token1 {
                id
                symbol
                name
              }
            }
          }
    `
    return gql(qs)
}

export const ANALYTICS_LIQUIDITY_QUERY = ({ scale }) => {
    const qs = `
        query MyQuery($id: ID = "") {
            factories {
              dayData(first: ${scale}, orderBy: date, orderDirection: desc) {
                liquidityUSD
                date
              }
            }
        }
    `
    return gql(qs)
}

export const ANALYTICS_VOLUME_QUERY = ({ scale }) => {
    const qs = `
        query MyQuery($id: ID = "") {
            factories {
              dayData(first: ${scale}, orderBy: date, orderDirection: desc) {
                volumeUSD
                date
              }
            }
        }
    `
    return gql(qs)
}

export const PAIRS_QUERY = ({ page, orderBy, order, rowsPerPage, search }) => {
    const skip = (page + 1) * rowsPerPage
    const qs = `
        query MyQuery {
            pairs(
                ${search && search.length ? 'where: {name_contains_nocase: "' + search + '"}' : ''}
                first: ${skip}, skip: 0, orderBy: ${orderBy}, orderDirection: ${order}) {
                token0Price
                token1Price
                totalSupply
                txCount
                volumeToken0
                volumeToken1
                name
                volumeUSD
                reserveUSD
                untrackedVolumeUSD
                dayData(first: 2, orderBy: date, orderDirection: desc) {
                    txCount
                    volumeUSD
                    date
                }
                token0 {
                    id
                    name
                    symbol
                }
                token1 {
                    id
                    name
                    symbol
                }
            }
            factories {
                pairCount
            }
        }
    `

    return gql(qs)
}

export const TOKENS_COUNT_QUERY = gql`
    query MyQuery {
        tokens(first: 1000) {
            txCount
        }
    }
`

export const ANALYTICS_PAIR_VOLUME_QUERY = () => {
    return gql`
  query GetPairVolume($token0: String!, $token1: String!) {
    pairs(
      where: { token0_: { id: $token0 }, token1_: { id: $token1 } }
    ) {
        dayData(first: 7) {
          volumeUSD
          date
        }
      }
  }
  `
}

export const ANALYTICS_PAIR_TVL_QUERY = ({ scale }) => {
    return gql`
  query GetPairVolume($token0: String!, $token1: String!) {
    pairs(
      where: { token0_: { id: $token0 }, token1_: { id: $token1 } }
    ) {
        dayData(first: ${scale}) {
          date
          reserveUSD
        }
      }
  }
  `
}
