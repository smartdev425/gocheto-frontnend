import { ChainId, Trade, TradeType } from '@gocheto-dex/sdk'
import { useActiveWeb3React } from '../../hooks'
import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { Field } from '../../state/swap/actions'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import { computeSlippageAdjustedAmounts, computeTradePriceBreakdown } from '../../utils/prices'
import { AutoColumn } from '../Column'
import QuestionHelper from '../QuestionHelper'
import { RowBetween, RowFixed } from '../Row'
import FormattedPriceImpact from './FormattedPriceImpact'
import SwapRoute from './SwapRoute'
import Link from 'next/link'

function TradeSummary({ trade, allowedSlippage }: { trade: Trade; allowedSlippage: number }) {
    const theme = useContext(ThemeContext)
    const { chainId } = useActiveWeb3React()
    const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdown(trade)
    const isExactIn = trade.tradeType === TradeType.EXACT_INPUT
    const slippageAdjustedAmounts = computeSlippageAdjustedAmounts(trade, allowedSlippage)

    return (
        <>
            <AutoColumn style={{ padding: '16px' }}>
                <RowBetween>
                    <RowFixed>
                        <div className="text-sm">{isExactIn ? 'Minimum received' : 'Maximum sold'}</div>
                        <QuestionHelper text="Your transaction will revert if there is a large, unfavorable price movement before it is confirmed." />
                    </RowFixed>
                    <RowFixed>
                        <div className="text-sm font-bold text-high-emphesis">
                            {isExactIn
                                ? `${slippageAdjustedAmounts[Field.OUTPUT]?.toSignificant(
                                      4
                                  )} ${trade.outputAmount.currency.getSymbol(chainId)}` ?? '-'
                                : `${slippageAdjustedAmounts[Field.INPUT]?.toSignificant(
                                      4
                                  )} ${trade.inputAmount.currency.getSymbol(chainId)}` ?? '-'}
                        </div>
                    </RowFixed>
                </RowBetween>
                <RowBetween>
                    <RowFixed>
                        <div className="text-sm">Price Impact</div>
                        <QuestionHelper text="The difference between the market price and estimated price due to trade size." />
                    </RowFixed>
                    <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
                </RowBetween>

                <RowBetween>
                    <RowFixed>
                        <div className="text-sm">Liquidity Provider Fee</div>
                        <QuestionHelper text="A portion of each trade (0.3%) goes to liquidity providers as a protocol incentive." />
                    </RowFixed>
                    <div className="text-sm font-bold text-high-emphesis">
                        {realizedLPFee
                            ? `${realizedLPFee.toSignificant(4)} ${trade.inputAmount.currency.getSymbol(chainId)}`
                            : '-'}
                    </div>
                </RowBetween>
            </AutoColumn>
        </>
    )
}

export interface AdvancedSwapDetailsProps {
    trade?: Trade
}

export function AdvancedSwapDetails({ trade }: AdvancedSwapDetailsProps) {
    const theme = useContext(ThemeContext)
    const { chainId } = useActiveWeb3React()

    const [allowedSlippage] = useUserSlippageTolerance()

    const showRoute = Boolean(trade && trade.route.path.length > 2)

    return (
        <AutoColumn gap="0px">
            {trade && (
                <>
                    <TradeSummary trade={trade} allowedSlippage={allowedSlippage} />
                    {showRoute && (
                        <>
                            <RowBetween style={{ padding: '0px 16px' }}>
                                <span style={{ display: 'flex', alignItems: 'center' }}>
                                    <div className="text-sm">Route</div>
                                    <QuestionHelper text="Routing through these tokens resulted in the best price for your trade." />
                                </span>
                                <SwapRoute trade={trade} />
                            </RowBetween>
                        </>
                    )}
                    {/* {chainId === ChainId.MAINNET && !showRoute && (
                        <div className="flex justify-center pt-1 px-4">
                            <Link
                                target='_blank'
                                href={
                                    'https://analytics.shibaswap.com/pairs/' +
                                    trade.route.pairs[0].liquidityToken.address
                                }
                            >
                                View pair analytics
                            </Link>
                        </div>
                    )} */}
                </>
            )}
        </AutoColumn>
    )
}
