import {useEffect, useRef, useState} from "react"
import {useTransition, animated, useSpring} from "@react-spring/web"
import {
  HiCalendar,
  HiCamera,
  HiChevronDown,
  HiChevronUp,
  HiOutlineMagnifyingGlassCircle,
  HiTag,
  HiUser,
} from "react-icons/hi2"
import {useHotkeys} from "react-hotkeys-hook"
import {useDrag} from "@use-gesture/react"
import {useNavigate} from "react-router-dom"
import debounce from "lodash.debounce"
import {PER_PAGE} from "../routes/carousel"
import clsx from "clsx"
import Rating from "./Rating"

export type ItemType = "video" | "image"

export interface CarouselItem {
  type: ItemType
  url: string
  title: string
  performers: string[]
  studio?: string
  date?: string
  tags: string[]
  details?: string
  rating?: number
  oCounter?: number
}

const buttonStyles =
  "rounded-full p-3 bg-purple-400 bg-opacity-50 text-white disabled:opacity-25"

function NavButtons({
  goToPrevious,
  goToNext,
  hasNextItem,
  hasPreviousItem,
}: {
  goToPrevious: () => void
  goToNext: () => void
  hasNextItem: boolean
  hasPreviousItem: boolean
}) {
  return (
    <div className="absolute flex flex-col gap-6 right-4 top-1/2 -translate-y-1/2 z-20">
      <button
        className={buttonStyles}
        disabled={!hasPreviousItem}
        onClick={() => goToPrevious()}
      >
        <HiChevronUp className="w-8 h-8" />
      </button>

      <button
        className={buttonStyles}
        disabled={!hasNextItem}
        onClick={() => goToNext()}
      >
        <HiChevronDown className="w-8 h-8" />
      </button>
    </div>
  )
}

interface OverlayProps {
  item?: CarouselItem
  nextItem: () => void
  previousItem: () => void
  onCrop: () => void
  onQueryChange: (query: string) => void
  hasNextItem: boolean
  hasPreviousItem: boolean
}

function Overlay({
  item,
  nextItem,
  previousItem,
  onCrop,
  onQueryChange,
  hasNextItem,
  hasPreviousItem,
}: OverlayProps) {
  const overlayTimeout = 2000

  const navigate = useNavigate()
  const [visible, setVisible] = useState(true)
  const [springs, api] = useSpring(() => ({
    from: {opacity: 0},
    config: {
      duration: 250,
    },
    onRest: () => {
      setVisible(springs.opacity.get() === 1)
    },
  }))
  const timeout = useRef<number>()

  useEffect(() => {
    showOverlay()
  }, [])

  const setQueryInUrl = (query: string) => {
    onQueryChange(query)
    navigate(
      {
        search: `?q=${encodeURIComponent(query)}`,
      },
      {replace: true}
    )
  }

  const debouncedSetQueryInUrl = debounce(setQueryInUrl, 500)

  const onChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    showOverlay()
    debouncedSetQueryInUrl(event.target.value)
  }

  const showOverlay = () => {
    clearTimeout(timeout.current)
    api.start({opacity: 1})
    timeout.current = window.setTimeout(() => {
      api.start({opacity: 0})
    }, overlayTimeout)
  }

  return (
    <animated.div
      onMouseMove={showOverlay}
      onClick={showOverlay}
      onKeyUp={showOverlay}
      className="w-full h-full absolute z-10"
      style={springs}
    >
      {visible && (
        <>
          <NavButtons
            goToNext={nextItem}
            goToPrevious={previousItem}
            hasNextItem={hasNextItem}
            hasPreviousItem={hasPreviousItem}
          />
        </>
      )}
      <input
        onChange={onChange}
        placeholder="Search..."
        className="text-white absolute top-1 w-60 text-center left-1/2 translate -translate-x-1/2 h-12 px-4 leading-6 bg-opacity-0 border-b-2 border-white bg-transparent focus:border-b-2 focus:outline-none placeholder-white"
      />

      {item && (
        <section className="absolute left-1/2 -translate-x-1/2 text-center truncate bottom-4 text-white p-2">
          <h1 className="text-xl lg:text-2xl">{item.title}</h1>
          {item.performers.length > 0 && (
            <p className="text-lg">
              <HiUser className="inline w-4 h-4 mr-2" />
              {item.performers.join(", ")}
            </p>
          )}
          {item.studio && (
            <p className="text-lg">
              <HiCamera className="inline w-4 h-4 mr-2" />
              {item.studio}
            </p>
          )}
          {item.date && (
            <p className="text-lg">
              <HiCalendar className="inline w-4 h-4 mr-2" />
              {item.date}
            </p>
          )}
        </section>
      )}
      <button
        onClick={onCrop}
        className={`${buttonStyles} absolute top-2 right-2`}
      >
        <HiOutlineMagnifyingGlassCircle />
      </button>
    </animated.div>
  )
}

function MediaItem({
  item,
  style,
  crop,
}: {
  item: CarouselItem
  style: any
  crop: boolean
}) {
  if (item.type === "video") {
    return (
      <animated.video
        src={item.url}
        playsInline
        autoPlay
        muted
        loop
        className={clsx("absolute w-full h-full", crop && "object-cover")}
        style={style}
      />
    )
  } else {
    return (
      <animated.img
        src={item.url}
        className={clsx(
          "absolute w-full h-full",
          !crop && "object-contain",
          crop && "object-cover"
        )}
        style={style}
      />
    )
  }
}

const listItemStyles = "flex gap-2 items-center"

function Sidebar({
  item,
  totalResults,
}: {
  item?: CarouselItem
  totalResults: number
}) {
  return (
    <section className="hidden lg:flex flex-col bg-purple-50 p-4 w-1/4 overflow-y-scroll overflow-x-hidden">
      {item && (
        <>
          <h1 className="text-3xl truncate font-bold mb-4">{item.title}</h1>
          <p className="mb-4">
            Found <strong>{totalResults}</strong> results.
          </p>
          {item.details && <p className="mb-4">{item.details}</p>}
          <ul className="flex flex-col gap-2">
            {item.performers.length > 0 && (
              <li className={listItemStyles}>
                <HiUser className="inline w-4 h-4" />
                {item.performers.join(", ")}
              </li>
            )}
            {item.studio && (
              <li className={listItemStyles}>
                <HiCamera className="inline w-4 h-4" />
                {item.studio}
              </li>
            )}
            {item.date && (
              <li className={listItemStyles}>
                <HiCalendar className="inline w-4 h-4" />
                {item.date}
              </li>
            )}
            {item.tags.length > 0 && (
              <li className={listItemStyles}>
                <ul className="text-xs flex flex-wrap items-center gap-1">
                  <HiTag className="inline w-6 h-6 mr-2" />
                  {item.tags.map((tag) => (
                    <li
                      key={tag}
                      className="bg-purple-200 rounded-full py-1 px-3"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </li>
            )}
            {item.rating && (
              <li className={listItemStyles}>
                <Rating rating={item.rating} />
              </li>
            )}
            {item.oCounter && (
              <li className={listItemStyles}>
                <span className="w-4 h-4">💦</span>
                {item.oCounter}
              </li>
            )}
          </ul>
        </>
      )}
    </section>
  )
}

interface Props {
  items: CarouselItem[]
  crop?: boolean
  loading?: boolean
  initialIndex?: number
  onItemChange?: (index: number) => void
  onNextPage: () => Promise<void>
  onPreviousPage: () => Promise<void>
  page: number
  totalPages: number
  totalResults: number
}

function Carousel({
  items,
  loading,
  initialIndex,
  onItemChange,
  onNextPage,
  onPreviousPage,
  page,
  totalPages,
  totalResults,
}: Props) {
  const [index, setIndex] = useState(initialIndex || 0)
  const [direction, setDirection] = useState(1)
  const [crop, setCrop] = useState(false)
  const hasNextItem = index < items.length - 1 || page < totalPages - 1
  const hasPreviousItem = index !== 0 || page > 1

  const transitions = useTransition(index, {
    from: {transform: `translateY(${direction === 1 ? "100%" : "-100%"})`},
    enter: {transform: "translateY(0%)"},
    leave: {transform: `translateY(${direction === 1 ? "-100%" : "100%"})`},
  })

  const bind = useDrag((props) => {
    const [, swipeY] = props.swipe
    if (swipeY === -1) {
      nextItem()
    } else if (swipeY === 1) {
      previousItem()
    }
  })

  const nextItem = async () => {
    if (!hasNextItem) {
      return
    }

    let nextIndex = index + 1
    if (nextIndex === items.length - 1 && page < totalPages - 1) {
      await onNextPage()
      nextIndex = 0
    }
    setIndex(nextIndex)
    setDirection(1)
    onItemChange && onItemChange(nextIndex)
  }

  const previousItem = async () => {
    if (!hasPreviousItem) {
      return
    }

    let nextIndex = index - 1

    if (nextIndex < 0) {
      await onPreviousPage()
      nextIndex = PER_PAGE - 1
    }

    setIndex(nextIndex)
    setDirection(-1)
    onItemChange && onItemChange(nextIndex)
  }

  useHotkeys(["w", "up"], previousItem, [index, length])
  useHotkeys(["s", "down"], nextItem, [index, length])

  const onQueryChange = () => {
    setIndex(0)
  }

  return (
    <div {...bind()} className="w-full h-full flex">
      <div className="relative touch-none grow">
        {!loading &&
          items.length > 0 &&
          transitions((style, index) => (
            <MediaItem style={style} item={items[index]} crop={crop} />
          ))}
        <Overlay
          item={items[index]}
          nextItem={nextItem}
          previousItem={previousItem}
          onCrop={() => setCrop((prev) => !prev)}
          onQueryChange={onQueryChange}
          hasNextItem={hasNextItem}
          hasPreviousItem={hasPreviousItem}
        />
        {items?.length === 0 && (
          <div className="flex flex-col items-center mt-16 justify-center text-white p-4">
            <h1 className="text-4xl">No results</h1>
            <p className="text-xl">Try a different search</p>
          </div>
        )}
      </div>

      <Sidebar item={items[index]} totalResults={totalResults} />
    </div>
  )
}

export default Carousel
